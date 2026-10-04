import { constants } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error('Node.js 24 kullanın.');
if (process.env.VERCEL || process.env.TURSO_DATABASE_URL || process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('Bu kurulum bağımsız VPS içindir. VERCEL, TURSO_DATABASE_URL ve BLOB_READ_WRITE_TOKEN değişkenlerini kaldırın.');
}
const root = resolve(import.meta.dirname, '..');
const directory = resolve(process.env.CMS_DATA_DIR || join(root, '.data'));
await mkdir(directory, { recursive: true, mode: 0o700 });
const destination = join(directory, 'cms.sqlite');
try {
  await copyFile(join(root, '.transfer/live-cms.sqlite'), destination, constants.COPYFILE_EXCL);
  console.log('Canlı içerik kopyası kuruldu:', destination);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Mevcut veritabanı korundu:', destination);
}
const db = new DatabaseSync(destination, { readOnly: true });
try {
  if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Veritabanı bütünlük kontrolü başarısız.');
  if (!db.prepare('SELECT id FROM credentials WHERE id=1').get()) throw new Error('Yönetici hesabı bulunamadı.');
  for (const table of ['projects', 'media', 'blog_posts']) {
    console.log(`${table}: ${db.prepare(`SELECT count(*) AS total FROM ${table}`).get().total}`);
  }
} finally { db.close(); }
