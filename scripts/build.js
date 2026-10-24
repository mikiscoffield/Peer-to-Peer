import {cp,mkdir,readFile,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function build(destination=resolve(root,'dist')){
 const config=JSON.parse(await readFile(resolve(root,'public/config.json'),'utf8'));
 if(!Number.isFinite(config.rate)||config.rate<=0||!Array.isArray(config.networks)||!config.networks.length)throw Error('Invalid public/config.json');
 for(const n of config.networks)if(typeof n.id!=='string'||typeof n.name!=='string')throw Error('Invalid network entry');
 await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
 // Explicit public assets only. Never publish backend files, receipts, env files or admin pages.
 for(const file of ['index.html','style.css','app.js','config.json','images'])await cp(resolve(root,'public',file),resolve(destination,file),{recursive:true});
 return destination;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){await build();console.log('Built static site in dist/');}
