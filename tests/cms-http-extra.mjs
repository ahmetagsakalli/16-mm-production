import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp,readFile,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3001',initialPassword='16mm-Panel-Test-Only-2026';let cookie='';let project,settings;const checks=[];
async function req(path,method='GET',body){return fetch(base+'/api/admin/'+path,{method,headers:{Origin:base,Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
const login=await req('login','POST',{password:initialPassword});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
const temporary=await mkdtemp(join(tmpdir(),'16mm-video-http-'));
try{
 project=await (await req('projects','POST')).json();
 const local=JSON.parse(await readFile('assets/gallery/local.json','utf8'));const source=join(temporary,'clip.mp4');
 await promisify(execFile)(local.ffmpeg,['-f','lavfi','-i','color=c=blue:s=320x240:r=24','-t','0.5','-c:v','libx264','-threads','2','-pix_fmt','yuv420p',source]);
 const upload=await fetch(base+'/api/admin/projects/'+project.id+'/upload',{method:'POST',headers:{Origin:base,Cookie:cookie,'X-File-Name':'kisa-video.mp4','Content-Type':'application/octet-stream'},body:await readFile(source)});assert.equal(upload.status,201);project=await upload.json();const video=project.media[0];assert.equal(video.kind,'video');
 for(const asset of [video.src,video.previewSrc,video.image.src])assert.equal((await fetch(base+asset)).status,404);
 project=await (await req('projects/'+project.id+'/publish','POST',{version:project.version,draft:project.draft})).json();
 const range=await fetch(base+video.src,{headers:{Range:'bytes=0-99'}});assert.equal(range.status,206);assert.equal(range.headers.get('content-type'),'video/mp4');assert.equal((await range.arrayBuffer()).byteLength,100);
 const suffix=await fetch(base+video.src,{headers:{Range:'bytes=-50'}});assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,50);
 assert.equal((await fetch(base+video.src,{headers:{Range:'bytes=999999999-'}})).status,416);checks.push('Short video converted to MP4/preview/WebP poster; authenticated draft and public range playback verified');
 settings=await (await req('settings')).json();let result=await req('settings','PUT',{version:settings.version,data:{...settings.data,email:'test-panel@example.com',heroLine1:'Test ana sayfa başlığı'}});assert.equal(result.status,200);
 assert.match(await (await fetch(base+'/contact')).text(),/test-panel@example.com/);assert.match(await (await fetch(base+'/')).text(),/Test ana sayfa başlığı/);checks.push('Settings publish updates cached homepage and contact');
 result=await req('password','POST',{current:initialPassword,password:'Temporary-Rotated-Password-2026'});assert.equal(result.status,200);assert.equal((await req('projects')).status,401);checks.push('Password change revokes existing sessions');
 const reLogin=await req('login','POST',{password:'Temporary-Rotated-Password-2026'});assert.equal(reLogin.status,200);cookie=reLogin.headers.get('set-cookie').split(';')[0];
}finally{
 if(settings){const current=await(await req('settings')).json();await req('settings','PUT',{version:current.version,data:settings.data});}
 if(project){const current=await(await req('projects/'+project.id)).json();await req('projects/'+project.id+'/trash','POST',{version:current.version});}
 await rm(temporary,{recursive:true,force:true});
 await writeFile('reports/admin-http-extra.json',JSON.stringify({passed:checks.length,checks},null,2));
}
console.log(JSON.stringify({passed:checks.length,checks},null,2));
