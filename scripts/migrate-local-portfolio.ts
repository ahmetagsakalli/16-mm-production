import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dataDirectory, publishedProjects } from '../src/lib/cms/store';
import { site } from '../src/content/site';

if (process.env.TURSO_DATABASE_URL || process.env.VERCEL) throw new Error('Bu düzenleme yalnızca yerel veritabanında çalışır.');
// Seed additive imports before changing the existing category assignments.
await publishedProjects();
const gallery = JSON.parse(readFileSync(resolve('src/content/gallery.json'), 'utf8'));
const sources = new Map<string, string[]>(gallery.projects.map((project: { sourceFolder: string; categories: string[] }) => [project.sourceFolder, project.categories]));
const database = new DatabaseSync(resolve(dataDirectory(), 'cms.sqlite'));
database.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
let changed = 0;
try {
  for (const row of database.prepare('SELECT id,source_folder,draft,published FROM projects').all()) {
    const categories = sources.get(String(row.source_folder));
    if (!categories) continue;
    const draft = JSON.parse(String(row.draft));
    const published = row.published ? JSON.parse(String(row.published)) : null;
    if (JSON.stringify(draft.categories) === JSON.stringify(categories) && (!published || JSON.stringify(published.categories) === JSON.stringify(categories))) continue;
    if (published) database.prepare('INSERT INTO revisions(project_id,body,created_at) VALUES(?,?,?)').run(row.id, String(row.published), Date.now());
    draft.categories = categories;
    if (published) published.categories = categories;
    database.prepare('UPDATE projects SET draft=?,published=?,version=version+1,updated_at=? WHERE id=?').run(JSON.stringify(draft), published ? JSON.stringify(published) : null, Date.now(), row.id);
    changed++;
  }
  const row = database.prepare('SELECT data FROM settings WHERE id=1').get()!;
  const settings = JSON.parse(String(row.data));
  if (settings.email !== site.contact.email || settings.address !== site.address) {
    settings.email = site.contact.email; settings.address = site.address;
    database.prepare('UPDATE settings SET data=?,version=version+1 WHERE id=1').run(JSON.stringify(settings));
  }
  database.exec('COMMIT');
} catch (error) { database.exec('ROLLBACK'); throw error; }
console.log(`${changed} yerel proje kategorisi güncellendi. Medya, yayın durumu ve önceki kayıtlar korundu.`);
console.log(database.prepare('SELECT COUNT(*) projects, SUM(json_array_length(published,\'$.media\')) media FROM projects WHERE deleted=0 AND published IS NOT NULL').get());
database.close();
