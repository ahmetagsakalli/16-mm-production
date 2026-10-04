import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client/http';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) throw new Error('Turso environment variables are required.');
const source = new DatabaseSync(resolve(process.argv[2] || '.data/cms.sqlite'), { readOnly: true });
const remote = createClient({url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN});
const tables = source.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
const existing = await remote.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'");
if (existing.rows.length) throw new Error('Destination already contains CMS data. Migration refuses to overwrite it.');
const statements = tables.map(t => ({sql:t.sql,args:[]}));
const migrated = [];
for (const table of tables) {
  // Cloud sessions are issued by a fresh sign-in, not copied from localhost.
  const rows = ['sessions','attempts','jobs'].includes(table.name) ? [] : source.prepare(`SELECT * FROM "${table.name}"`).all();
  for (const row of rows) {
    const keys = Object.keys(row);
    statements.push({sql:`INSERT INTO "${table.name}" (${keys.map(k=>`"${k}"`).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,args:keys.map(k=>row[k])});
  }
  migrated.push({table:table.name,rows});
}
statements.push({sql:'CREATE INDEX IF NOT EXISTS media_project_id ON media(project_id)',args:[]});
statements.push({sql:"CREATE TABLE IF NOT EXISTS cloud_uploads(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, lease_until INTEGER NOT NULL DEFAULT 0)",args:[]});
await remote.batch(statements,'write');
const canonical = rows => JSON.stringify(rows.map(r=>Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b)))).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
for (const {table,rows} of migrated) {
  const result = await remote.execute(`SELECT * FROM "${table}"`);
  const expected = canonical(rows), actual = canonical(result.rows.map(r=>Object.fromEntries(Object.keys(rows[0]||{}).map(k=>[k,r[k]]))));
  if (expected !== actual) throw new Error(`Verification failed for ${table}`);
  console.log(`${table}: ${rows.length} rows verified (${createHash('sha256').update(expected).digest('hex').slice(0,12)})`);
}
remote.close(); source.close();
