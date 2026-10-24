import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {localStorage,supabaseStorage} from './storage.js';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,timingSafeEqual} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
export const networks=[{id:'TRC20',name:'TRON'},{id:'ERC20',name:'Ethereum'},{id:'BEP20',name:'BNB Smart Chain'},{id:'SOL',name:'Solana'},{id:'TON',name:'TON'},{id:'ARBITRUM',name:'Arbitrum One'},{id:'OPTIMISM',name:'Optimism'},{id:'POLYGON',name:'Polygon'},{id:'AVAXC',name:'Avalanche C-Chain'},{id:'APTOS',name:'Aptos'}];
export function validateOrder(o,rate=182.2,allowed=networks){
 if(!o||!allowed.some(n=>n.id===o.network))return 'Choose a supported USDT network.';
 if(typeof o.amount!=='number'||!Number.isFinite(o.amount)||o.amount<6||o.amount>100000||Math.abs(o.amount*100-Math.round(o.amount*100))>1e-6)return 'Enter 6–100,000 USDT, with up to two decimal places.';
 if(o.rate!==rate)return 'The rate changed. Refresh before paying.';
 if(typeof o.wallet!=='string'||o.wallet.length>120)return 'Enter a valid receiving wallet.';
 const patterns={TRC20:/^T[1-9A-HJ-NP-Za-km-z]{33}$/,SOL:/^[1-9A-HJ-NP-Za-km-z]{32,44}$/,TON:/^(?:[EU]Q[A-Za-z0-9_-]{46}|0:[0-9a-fA-F]{64})$/,APTOS:/^0x[0-9a-fA-F]{1,64}$/};
 if(!(patterns[o.network]||/^0x[0-9a-fA-F]{40}$/).test(o.wallet))return 'Check your wallet address and selected network.';
 if(o.memo!==undefined&&(typeof o.memo!=='string'||o.memo.length>100||/[\x00-\x1f]/.test(o.memo)))return 'Memo must be plain text, up to 100 characters.';
 return null;
}
function imageType(b){if(b.length>3&&b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return 'image/webp';return null;}
export function createApp(options={}){
 const adminToken=options.adminToken??process.env.ADMIN_TOKEN;
 const dataDir=options.dataDir??process.env.DATA_DIR??resolve(root,'.data');
 if(Boolean(process.env.SUPABASE_URL)!==Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY))throw Error('Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
 const store=options.store??(process.env.SUPABASE_URL?supabaseStorage(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY):localStorage(dataDir));
 const rate=Number(options.rate??process.env.USDT_ETB_RATE??182.2);
 if(!Number.isFinite(rate)||rate<=0)throw Error('USDT_ETB_RATE must be a positive number');
 const enabled=(process.env.ENABLED_NETWORKS||networks.map(n=>n.id).join(',')).split(',');
 const active=networks.filter(n=>enabled.includes(n.id));if(!active.length)throw Error('No enabled networks');
 const attempts=new Map();
 const authorized=req=>{const token=(req.headers.authorization||'').replace(/^Bearer /,'');return adminToken&&Buffer.byteLength(token)===Buffer.byteLength(adminToken)&&timingSafeEqual(Buffer.from(token),Buffer.from(adminToken));};
 return http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob:; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors https://web.telegram.org https://*.telegram.org");
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 const body=async()=>{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024+20000)throw Object.assign(Error('File exceeds 5 MB'),{status:413});chunks.push(chunk);}return Buffer.concat(chunks);};
 try{
 if(url.pathname==='/api/config'&&req.method==='GET')return json(200,{rate,networks:active,uploadsEnabled:!!adminToken});
 if(req.method==='POST'){
 const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'Invalid request origin'});
 }
 if(url.pathname==='/api/validate'&&req.method==='POST'){const o=JSON.parse((await body()).toString());const error=validateOrder(o,rate,active);return json(error?400:200,error?{error}:{valid:true});}
 if(url.pathname==='/api/orders'&&req.method==='POST'){
 if(!adminToken)return json(503,{error:'Direct uploads are not configured. Contact support on Telegram'});
 const ip=req.socket.remoteAddress;const now=Date.now();if(attempts.size>10000)for(const [key,value]of attempts)if(now-value.start>3600000)attempts.delete(key);const count=attempts.get(ip);if(count&&now-count.start<3600000&&count.n>=10)return json(429,{error:'Too many submissions. Please contact support'});attempts.set(ip,{start:count&&now-count.start<3600000?count.start:now,n:count&&now-count.start<3600000?count.n+1:1});
 const raw=await body();const request=new Request('http://localhost',{method:'POST',headers:{'content-type':req.headers['content-type']||''},body:raw});const form=await request.formData();const order=JSON.parse(form.get('order'));const error=validateOrder(order,rate,active);if(error)return json(400,{error});const file=form.get('screenshot');if(!file||typeof file.arrayBuffer!=='function'||file.size>5242880||file.size===0)return json(400,{error:'Choose a screenshot up to 5 MB'});const bytes=Buffer.from(await file.arrayBuffer());const type=imageType(bytes);if(!type||type!==file.type)return json(400,{error:'Only valid JPG, PNG or WebP images are accepted'});
 const id=randomUUID();const record={id,amount:order.amount,network:order.network,wallet:order.wallet,memo:order.memo||'',rate,totalETB:Math.round(order.amount*rate*100)/100,type,status:'pending',createdAt:new Date().toISOString()};await store.save(record,bytes);
 // Delivery failure never loses the order: the private admin inbox is the source of truth.
 if(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_ADMIN_CHAT_ID){try{const fd=new FormData();fd.set('chat_id',process.env.TELEGRAM_ADMIN_CHAT_ID);fd.set('caption',`Payment pending: ${id}\n${record.amount} USDT (${record.network})\n${record.totalETB} ETB\nWallet: ${record.wallet}\nMemo: ${record.memo}`);fd.set('photo',new Blob([bytes],{type}),'receipt');const result=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,{method:'POST',body:fd,signal:AbortSignal.timeout(10000)});if(!result.ok)console.error('Telegram notification failed; review admin inbox.');}catch{console.error('Telegram notification unavailable; review admin inbox.');}}
 return json(201,{id,status:'pending'});
 }
 if(url.pathname.startsWith('/api/admin/')){
 if(!authorized(req))return json(401,{error:'Authentication required'});
 if(req.method!=='GET')return json(405,{error:'Method not allowed'});
 if(url.pathname==='/api/admin/orders'){const orders=await store.list();return json(200,orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));}
 const match=url.pathname.match(/^\/api\/admin\/screenshots\/([0-9a-f-]{36})$/);if(match){const image=await store.image(match[1]);res.writeHead(200,{'Content-Type':image.type,'Content-Disposition':'inline'});return res.end(image.bytes);}return json(404,{error:'Not found'});
 }
 const files={'/':'index.html','/style.css':'style.css','/app.js':'app.js','/admin':'admin.html','/admin.js':'admin.js'};if(req.method==='GET'&&files[url.pathname]){const file=files[url.pathname];res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript');return res.end(await readFile(resolve(root,'public',file)));}
 return json(404,{error:'Not found'});
 }catch(err){if(err.code==='ENOENT')return json(404,{error:'Not found'});if(err instanceof SyntaxError||err instanceof TypeError)return json(400,{error:'Invalid request'});json(err.status||500,{error:err.status?err.message:'Unable to process request'});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const server=createApp();server.listen(Number(process.env.PORT||3000),process.env.HOST||'0.0.0.0',()=>console.log('Lykun listening on port '+(process.env.PORT||3000)));}
