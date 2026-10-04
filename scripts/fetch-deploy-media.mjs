import { restoreDeployArchive } from './restore-deploy-archive.mjs';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,stat,rm,copyFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function fetchDeployMedia(root) {
  if (!process.env.VERCEL) return;
  const manifest=JSON.parse(await readFile(join(root,'assets/gallery/deployment.json'),'utf8'));
  if (manifest.archive) return restoreDeployArchive(root, manifest);
  let completed=0;
  const byHash = new Map();
  for (const item of manifest.files) { const group = byHash.get(item.sha256) || []; group.push(item); byHash.set(item.sha256, group); }
  const pending=[...byHash.values()];
  async function download(path,hash,bytes){
    const url=`https://media.githubusercontent.com/media/${manifest.repository}/${manifest.commit}/${path.split('/').map(encodeURIComponent).join('/')}`;
    for(let attempt=0;attempt<4;attempt++) {
      try{
        const response=await fetch(url,{signal:AbortSignal.timeout(90000),headers:process.env.DEPLOY_MEDIA_GITHUB_TOKEN?{Authorization:`Bearer ${process.env.DEPLOY_MEDIA_GITHUB_TOKEN}`}:{}});
        if(!response.ok)throw new Error(`Media HTTP ${response.status}: ${path}`);
        const buffer=Buffer.from(await response.arrayBuffer());
        if(buffer.length!==bytes||createHash('sha256').update(buffer).digest('hex')!==hash)throw new Error(`Media checksum mismatch: ${path}`);
        return buffer;
      }catch(error){if(attempt===3)throw error; await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
    }
  }
  await Promise.all(Array.from({length:8},async()=>{
    for(let group;(group=pending.shift());){
      const item=group[0];
      const destination=join(root,item.path);
      const exists=(await stat(destination).catch(()=>null))?.size===item.bytes;
      await mkdir(dirname(destination),{recursive:true});
      const temporary=`${destination}.fetching`;
      try {
        if(exists) { /* Already available in a local build. */ }
        else if(item.parts){
          await writeFile(temporary,new Uint8Array());
          const {appendFile}=await import('node:fs/promises');
          for(const part of item.parts)await appendFile(temporary,await download(part.path,part.sha256,part.bytes));
          const buffer=await readFile(temporary);
          if(buffer.length!==item.bytes||createHash('sha256').update(buffer).digest('hex')!==item.sha256)throw new Error(`Video checksum mismatch: ${item.path}`);
        }else await writeFile(temporary,await download(item.path,item.sha256,item.bytes));
        if(!exists)await rename(temporary,destination);
        for(const duplicate of group.slice(1)){ const path=join(root,duplicate.path); await mkdir(dirname(path),{recursive:true}); await copyFile(destination,path); }
      }catch(error){await rm(temporary,{force:true});throw error;}
      completed+=group.length;
      if(completed%250<group.length)console.log(`Gallery: ${completed}/${manifest.files.length} files restored and verified`);
    }
  }));
  console.log(`Gallery ready: ${manifest.files.length} files; original paths preserved.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await fetchDeployMedia(resolve(import.meta.dirname,'..'));
