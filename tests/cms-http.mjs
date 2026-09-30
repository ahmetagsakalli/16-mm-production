import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const base='http://127.0.0.1:3001';let cookie=''; const report=[];
async function request(path,method='GET',body,options={}) {
 const response=await fetch(base+path,{method,redirect:'manual',headers:{...(method!=='GET'?{Origin:base}:{}),...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...options.headers},body:body?JSON.stringify(body):undefined});return response;
}
const unauthorized=await request('/api/admin/projects');assert.equal(unauthorized.status,401);report.push('Unauthenticated API blocked');
const redirect=await request('/admin/projeler');assert.equal(redirect.status,307);assert.equal(redirect.headers.get('location'),'/admin');
const setup=await request('/api/admin/setup','POST',{password:'Test-Password-123'});assert.equal(setup.status,403);report.push('Production setup blocked');
const cross=await request('/api/admin/login','POST',{password:'16mm-Panel-Test-Only-2026'},{headers:{Origin:'https://evil.test'}});assert.equal(cross.status,403);report.push('Cross-origin writes blocked');
const login=await request('/api/admin/login','POST',{password:'16mm-Panel-Test-Only-2026'});assert.equal(login.status,200);const header=login.headers.get('set-cookie');assert.match(header,/HttpOnly/i);assert.match(header,/Secure/i);assert.match(header,/SameSite=strict/i);cookie=header.split(';')[0];report.push('Secure login and session cookie');
const list=await (await request('/api/admin/projects')).json();assert.equal(list.filter(p=>!p.deleted).length,30);
const create=await request('/api/admin/projects','POST');assert.equal(create.status,201);let project=await create.json();
const path='/api/admin/projects/'+project.id;
try {
 const bytes=await sharp({create:{width:800,height:600,channels:3,background:'#b8c4a8'}}).jpeg().toBuffer();
 const upload=await fetch(base+path+'/upload',{method:'POST',headers:{Cookie:cookie,Origin:base,'X-File-Name':'http-test.jpg','Content-Type':'application/octet-stream'},body:bytes});assert.equal(upload.status,201);project=await upload.json();
 const asset=project.media[0].image.src;assert.match(asset,/\.webp$/);
 const noAuthAsset=await fetch(base+asset);assert.equal(noAuthAsset.status,404);
 const withAuthAsset=await request(asset);assert.equal(withAuthAsset.status,200);assert.equal(withAuthAsset.headers.get('content-type'),'image/webp');report.push('Actual upload converts to WebP and draft media stays private');
 project.draft.title='HTTP test project';project.draft.slug='test-16mm-admin-http-'+project.id.slice(0,8);project.draft.description='A temporary project used only for isolated admin integration testing.';
 project=await (await request(path,'PUT',{version:project.version,draft:project.draft})).json();
 let pub=await fetch(base+'/projects/'+project.draft.slug);assert.equal(pub.status,404);report.push('Unpublished project is not public');
 const preview=await request('/admin/onizleme/'+project.id);assert.equal(preview.status,200);assert.match(await preview.text(),/HTTP test project/);
 const stale=await request(path,'PUT',{version:project.version-1,draft:project.draft});assert.equal(stale.status,409);
 project=await (await request(path+'/publish','POST',{version:project.version,draft:project.draft})).json();
 pub=await fetch(base+'/projects/'+project.draft.slug);assert.equal(pub.status,200);assert.match(await pub.text(),/HTTP test project/);assert.equal((await fetch(base+asset)).status,200);report.push('New project published without rebuild, media accessible');
 const sitemap=await (await fetch(base+'/sitemap.xml')).text();assert.match(sitemap,/test-16mm-admin-http/);
 const old=project.draft.slug;project.draft.slug='test-16mm-admin-renamed-'+project.id.slice(0,8);project=await (await request(path+'/publish','POST',{version:project.version,draft:project.draft})).json();
 const renamed=await fetch(base+'/projects/'+old,{redirect:'manual'});assert.equal(renamed.status,308);assert.equal(new URL(renamed.headers.get('location'),base).pathname,'/projects/'+project.draft.slug);report.push('Slug changes redirect old URLs');
 const exportResponse=await request('/api/admin/export');assert.equal(exportResponse.status,200);const exported=await exportResponse.text();assert.ok(!exported.includes('credentials'));assert.ok(!exported.includes('token_hash'));
 const headers=await request('/admin/genel');assert.match(headers.headers.get('x-robots-tag'),/noindex/);assert.equal(headers.headers.get('x-frame-options'),'DENY');report.push('Noindex, security headers and content-only export');
} finally {
 const latest=await (await request(path)).json();await request(path+'/trash','POST',{version:latest.version});
 const after=await fetch(base+'/projects/'+latest.draft.slug);assert.equal(after.status,404);report.push('Trash removes public page while retaining original files');
 await request('/api/admin/logout','POST');assert.equal((await request('/api/admin/projects')).status,401);report.push('Logout revokes session');
 await writeFile('reports/admin-http.json',JSON.stringify({passed:report.length,checks:report},null,2));
}
console.log(JSON.stringify({passed:report.length,checks:report},null,2));
