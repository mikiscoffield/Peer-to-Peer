import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
export function localStorage(dir){return {
 async save(record,bytes){await mkdir(dir,{recursive:true,mode:0o700});await writeFile(resolve(dir,record.id+'.image'),bytes,{mode:0o600,flag:'wx'});await writeFile(resolve(dir,record.id+'.json'),JSON.stringify(record),{mode:0o600,flag:'wx'});},
 async list(){await mkdir(dir,{recursive:true,mode:0o700});const files=(await readdir(dir)).filter(n=>/^[0-9a-f-]{36}\.json$/.test(n));return Promise.all(files.map(async n=>JSON.parse(await readFile(resolve(dir,n),'utf8'))));},
 async image(id){const record=JSON.parse(await readFile(resolve(dir,id+'.json'),'utf8'));return {type:record.type,bytes:await readFile(resolve(dir,id+'.image'))};}
};}
export function supabaseStorage(url,key,fetcher=fetch){
 const base=url.replace(/\/$/,'');if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base))throw Error('SUPABASE_URL must be your https://project.supabase.co URL');
 const headers={apikey:key,Authorization:'Bearer '+key};
 async function request(path,options={}){const r=await fetcher(base+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000)});if(!r.ok){const error=Error('Private storage request failed');if(r.status===404)error.code='ENOENT';throw error;}return r;}
 return {
 async save(record,bytes){await request('/storage/v1/object/receipts/'+record.id,{method:'POST',headers:{'Content-Type':record.type,'x-upsert':'false'},body:bytes});try{await request('/rest/v1/orders',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(record)});}catch(err){try{await request('/storage/v1/object/receipts',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[record.id]})});}catch{}throw err;}},
 async list(){return (await request('/rest/v1/orders?select=*&order=createdAt.desc&limit=1000')).json();},
 async image(id){const records=await(await request('/rest/v1/orders?id=eq.'+id+'&select=type')).json();if(!records.length)throw Object.assign(Error('Not found'),{code:'ENOENT'});return {type:records[0].type,bytes:Buffer.from(await(await request('/storage/v1/object/authenticated/receipts/'+id)).arrayBuffer())};}
 };
}
