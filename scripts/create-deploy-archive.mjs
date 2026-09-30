import { createReadStream, createWriteStream } from 'node:fs';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
const manifestPath='assets/gallery/deployment.json';
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const unique=[...new Map(manifest.files.map(file=>[file.sha256,file])).values()];
const destination=process.argv[2];
if(!destination)throw new Error('Pass an archive destination outside the repository.');
async function* parts(){for(const file of unique)for await(const chunk of createReadStream(file.path))yield chunk;}
await pipeline(parts(),createGzip({level:1}),createWriteStream(destination));
const hash=createHash('sha256');for await(const chunk of createReadStream(destination))hash.update(chunk);
const sha256=hash.digest('hex'),pathname=`deployment/gallery-${sha256}.gz`;
await put(pathname,createReadStream(destination),{access:'private',addRandomSuffix:false,allowOverwrite:false,multipart:true,contentType:'application/gzip',onUploadProgress:e=>{if(e.percentage===100)console.log('Archive upload complete');}});
manifest.archive={format:'16mm-concatenated-gzip-v1',pathname,sha256,bytes:(await stat(destination)).size,objects:unique.map(({sha256,bytes})=>({sha256,bytes}))};
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({files:manifest.files.length,objects:unique.length,archiveBytes:manifest.archive.bytes,pathname}));
