import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { verify } from '@node-rs/argon2';
const temporary = await mkdtemp(join(tmpdir(), '16mm-cms-test-'));
process.env.CMS_DATA_DIR = temporary;
const store = await import('../src/lib/cms/store');
const auth = await import('../src/lib/cms/auth');
const { upload } = await import('../src/lib/cms/upload');
after(async () => { store.db().close(); await rm(temporary, { recursive: true, force: true }); });

test('existing albums are seeded without losing images, video, source folders or order', () => {
  const projects = store.listProjects();
  assert.equal(projects.length, 30);
  assert.equal(projects.reduce((n,p) => n+p.photoCount,0),654);
  assert.equal(projects.reduce((n,p) => n+p.videoCount,0),1);
  assert.equal(store.publishedProjects().length,30);
  assert.equal(store.hasPublishedProject(projects[0].slug), true);
  assert.equal(store.hasPublishedProject('nonexistent-seo-audit'), false);
  for(const p of projects) { const record=store.getProjectRecord(p.id); assert.ok(record.sourceFolder); assert.equal(record.draft.media.length,record.media.length); }
});
test('draft isolation, publish, optimistic conflict, revision restore and recoverable trash', () => {
  let p=store.getProjectRecord(store.listProjects()[0].id); const original=p.draft.title;
  p=store.saveProject(p.id,p.version,{...p.draft,title:'New draft <script>alert(1)</script>'});
  assert.equal(store.toPublicProject(p)?.title.tr,original);
  assert.throws(()=>store.saveProject(p.id,p.version-1,p.draft),/başka bir sekmede/);
  const revision=store.revisions(p.id)[0].id as number;
  p=store.saveProject(p.id,p.version,p.draft,true); assert.equal(store.toPublicProject(p)?.title.tr,p.draft.title);
  p=store.restoreRevision(p.id,p.version,revision); assert.equal(p.draft.title,original); assert.notEqual(p.published?.title,original);
  const count=p.media.length;p=store.setDeleted(p.id,p.version,true);assert.equal(store.toPublicProject(p),null);assert.equal(p.media.length,count);
  p=store.setDeleted(p.id,p.version,false);assert.equal(p.published,null);assert.equal(p.media.length,count);
});
test('invalid covers, foreign media and duplicate slugs cannot publish', () => {
  const rows=store.listProjects().filter(p=>!p.deleted&&p.status==='published');const p=store.getProjectRecord(rows[0].id),other=store.getProjectRecord(rows[1].id);
  assert.throws(()=>store.saveProject(p.id,p.version,{...p.draft,coverId:'not-owned'}),/Kapak/);
  assert.throws(()=>store.saveProject(p.id,p.version,{...p.draft,media:[...p.draft.media,other.draft.media[0]]}),/projeye ait/);
  assert.throws(()=>store.saveProject(p.id,p.version,{...p.draft,slug:other.draft.slug},true),/zaten kullanılıyor/);
  assert.throws(()=>store.saveProject(p.id,p.version,{...p.draft,slug:"' OR 1=1--"},true),/Adres/);
});
test('new photos become responsive WebP, private until published, originals byte-identical', async () => {
  let p=store.createProject();const bytes=await sharp({create:{width:80,height:60,channels:3,background:'#889968'}}).png().toBuffer();
  const request=new Request('http://localhost:3000/api/admin/upload',{method:'POST',headers:{'x-file-name':encodeURIComponent('Deneme Fotoğraf.png')},body:new Uint8Array(bytes)});
  p=await upload(request,p.id);const m=p.media[0];assert.equal(m.kind,'image');assert.ok(m.image.src.endsWith('.webp'));assert.equal(store.mediaIsPublic(m),false);
  const original=await readFile(join(temporary,'originals',p.id,m.id,'Deneme Fotoğraf.png'));assert.deepEqual(original,bytes);
  for(const suffix of ['', '-640','-768','-1280','-1920','-2560']){const meta=await sharp(join(temporary,'media',m.id,`asset${suffix}.webp`)).metadata();assert.equal(meta.format,'webp');}
  assert.equal(store.hasPublishedProject(p.draft.slug), false);
  p=store.saveProject(p.id,p.version,p.draft,true);assert.equal(store.mediaIsPublic(m),true);
  assert.equal(store.hasPublishedProject(p.draft.slug), true);
  const old=p.draft.slug;p=store.saveProject(p.id,p.version,{...p.draft,slug:'new-address'},true);assert.equal(store.redirectedSlug(old),'new-address');
  assert.equal(store.hasPublishedProject(old), false);
  assert.equal(store.hasPublishedProject('new-address'), true);
  p=store.setDeleted(p.id,p.version,true);assert.equal(store.mediaIsPublic(m),false);assert.ok((await stat(join(temporary,'originals',p.id,m.id,'Deneme Fotoğraf.png'))).size>0);
  assert.equal(store.hasPublishedProject('new-address'), false);
});
test('invalid upload bytes and traversal filenames are rejected without changing gallery',async()=>{
  const p=store.createProject();
  await assert.rejects(upload(new Request('http://localhost',{method:'POST',headers:{'x-file-name':'..%2Fbad.png'},body:'bad'}),p.id),/Dosya adı/);
  await assert.rejects(upload(new Request('http://localhost',{method:'POST',headers:{'x-file-name':'bad.png'},body:'<svg onload="alert(1)"/>'}),p.id),/Görsel okunamadı/);
  assert.equal(store.getProjectRecord(p.id).media.length,0);
});
test('passwords use Argon2, sessions expire, auth rate limit is persisted and setup is one-time',async()=>{
  await assert.rejects(auth.setInitialPassword('short'),/12/);
  await auth.setInitialPassword('Temporary-Test-Password-2099');
  const encoded=store.db().prepare('SELECT hash FROM credentials').get()!.hash as string;assert.ok(encoded.startsWith('$argon2id$'));assert.equal(await verify(encoded,'Temporary-Test-Password-2099'),true);
  await assert.rejects(auth.setInitialPassword('Another-Test-Password-2099'),/zaten/);
  for(let i=0;i<5;i++)auth.consumeAttempt('test-login');assert.throws(()=>auth.consumeAttempt('test-login'),/Çok fazla/);
  assert.equal(auth.sessionValid('invalid'),false);
  const token='f'.repeat(64),tokenHash=createHash('sha256').update(token).digest('hex');store.db().prepare('INSERT INTO sessions VALUES(?,?)').run(tokenHash,Date.now()+5000);assert.equal(auth.sessionValid(token),true);
  store.db().prepare('UPDATE sessions SET expires=0').run();assert.equal(auth.sessionValid(token),false);
  assert.throws(()=>auth.sameOrigin(new Request('http://localhost:3000',{headers:{Origin:'https://evil.test'}})),/kaynağı/);
  assert.throws(()=>auth.sameOrigin(new Request('http://localhost:3000')),/kaynağı/);
  auth.sameOrigin(new Request('http://localhost:3000',{headers:{Origin:'http://localhost:3000'}}));
  assert.equal(JSON.stringify(store.exportContent()).includes(encoded),false);
});
test('contact settings reject unsafe URLs and stale revisions',()=>{
  const settings=store.getSettings();assert.throws(()=>store.saveSettings(settings.version,{...settings.data,instagram:'javascript:alert(1)'}));
  const next=store.saveSettings(settings.version,{...settings.data,email:'hello@example.com'});assert.equal(next.data.email,'hello@example.com');
  assert.throws(()=>store.saveSettings(settings.version,settings.data),/başka bir sekmede/);
});


test('simple editor creates addresses and descriptions automatically and preserves published URLs', async () => {
  let p = store.createProject();
  const bytes = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#999999' } }).png().toBuffer();
  p = await upload(new Request('http://localhost', { method: 'POST', headers: { 'x-file-name': 'simple.png' }, body: new Uint8Array(bytes) }), p.id);
  const fields = (title: string) => ({ title, categories: p.draft.categories, coverId: p.draft.coverId, media: p.draft.media, order: p.draft.order, featured: false });
  p = store.saveProject(p.id, p.version, fields('Işık ve İç Mekân'), true);
  assert.match(p.draft.slug, /^isik-ve-ic-mekan-[a-f0-9]{8}$/);
  assert.match(p.draft.description, /Işık ve İç Mekân/);
  const originalSlug = p.draft.slug;
  p = store.saveProject(p.id, p.version, fields('Yeni Başlık'), true);
  assert.equal(p.draft.slug, originalSlug);
  assert.match(p.draft.description, /Yeni Başlık/);
  const settings = store.getSettings();
  const { email, phone, instagram, heroLine1, heroLine2 } = settings.data;
  const updated = store.saveSettings(settings.version, { email, phone, instagram, heroLine1, heroLine2 });
  assert.equal(updated.data.description, settings.data.description);
});
