import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {localStorage,supabaseStorage} from './storage.js';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
export const networks=[{id:'TRC20',name:'TRON'},{id:'ERC20',name:'Ethereum'},{id:'BEP20',name:'BNB Smart Chain'},{id:'SOL',name:'Solana'},{id:'TON',name:'TON'},{id:'ARBITRUM',name:'Arbitrum One'},{id:'OPTIMISM',name:'Optimism'},{id:'POLYGON',name:'Polygon'},{id:'AVAXC',name:'Avalanche C-Chain'},{id:'APTOS',name:'Aptos'}];
export function validateOrder(o,rate=182.2,allowed=networks){
 if(!o||typeof o.network!=='string'||o.network.length>80)return 'Network must be plain text.';
 if(typeof o.amount!=='number'||!Number.isFinite(o.amount)||o.amount<6||o.amount>100000||Math.abs(o.amount*100-Math.round(o.amount*100))>1e-6)return 'Enter 6–100,000 USDT, with up to two decimal places.';
 if(o.rate!==rate)return 'The rate changed. Refresh before paying.';
 if(typeof o.wallet!=='string'||o.wallet.length>200)return 'Wallet address must be plain text, up to 200 characters.';
 if(o.memo!==undefined&&(typeof o.memo!=='string'||o.memo.length>100||/[\x00-\x1f]/.test(o.memo)))return 'Memo must be plain text, up to 100 characters.';
 return null;
}
export function createApp(options={}){
 const adminToken=options.adminToken??process.env.ADMIN_TOKEN;
 const dataDir=options.dataDir??process.env.DATA_DIR??resolve(root,'.data');
 if(Boolean(process.env.SUPABASE_URL)!==Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY))throw Error('Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
 const store=options.store??(process.env.SUPABASE_URL?supabaseStorage(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY):localStorage(dataDir));
 const rate=Number(options.rate??process.env.USDT_ETB_RATE??182.2);
 if(!Number.isFinite(rate)||rate<=0)throw Error('USDT_ETB_RATE must be a positive number');
 const enabled=(process.env.ENABLED_NETWORKS||networks.map(n=>n.id).join(',')).split(',');
 const active=networks.filter(n=>enabled.includes(n.id));if(!active.length)throw Error('No enabled networks');
 const authorized=req=>{const token=(req.headers.authorization||'').replace(/^Bearer /,'');return adminToken&&Buffer.byteLength(token)===Buffer.byteLength(adminToken)&&timingSafeEqual(Buffer.from(token),Buffer.from(adminToken));};
 return http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob:; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors https://web.telegram.org https://*.telegram.org");
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 const body=async()=>{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024+20000)throw Object.assign(Error('File exceeds 5 MB'),{status:413});chunks.push(chunk);}return Buffer.concat(chunks);};
 try{
 if(url.pathname==='/api/config'&&req.method==='GET')return json(200,{rate,networks:active,uploadsEnabled:false});
 if(req.method==='POST'){
 const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'Invalid request origin'});
 }
 if(url.pathname==='/api/validate'&&req.method==='POST'){const o=JSON.parse((await body()).toString());const error=validateOrder(o,rate,active);return json(error?400:200,error?{error}:{valid:true});}
 if(url.pathname==='/api/orders'&&req.method==='POST'){
 return json(410,{error:'Screenshot uploads are disabled. Send your screenshot directly to @ChristianAbe on Telegram.'});
 }
 if(url.pathname.startsWith('/api/admin/')){
 if(!authorized(req))return json(401,{error:'Authentication required'});
 if(req.method!=='GET')return json(405,{error:'Method not allowed'});
 if(url.pathname==='/api/admin/orders'){const orders=await store.list();return json(200,orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));}
 const match=url.pathname.match(/^\/api\/admin\/screenshots\/([0-9a-f-]{36})$/);if(match){const image=await store.image(match[1]);res.writeHead(200,{'Content-Type':image.type,'Content-Disposition':'inline'});return res.end(image.bytes);}return json(404,{error:'Not found'});
 }
 const files={'/':'index.html','/style.css':'style.css','/app.js':'app.js','/admin':'admin.html','/admin.js':'admin.js','/images/exchange-world.svg':'images/exchange-world.svg','/images/telegram-receipt.svg':'images/telegram-receipt.svg'};if(req.method==='GET'&&files[url.pathname]){const file=files[url.pathname];res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/javascript');return res.end(await readFile(resolve(root,'public',file)));}
 return json(404,{error:'Not found'});
 }catch(err){if(err.code==='ENOENT')return json(404,{error:'Not found'});if(err instanceof SyntaxError||err instanceof TypeError)return json(400,{error:'Invalid request'});json(err.status||500,{error:err.status?err.message:'Unable to process request'});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const server=createApp();server.listen(Number(process.env.PORT||3000),process.env.HOST||'0.0.0.0',()=>console.log('Lykun listening on port '+(process.env.PORT||3000)));}
