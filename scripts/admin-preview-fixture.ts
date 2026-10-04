import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = await mkdtemp(join(tmpdir(), '16mm-admin-preview-'));
process.env.CMS_DATA_DIR = directory;
const { setInitialPassword } = await import('../src/lib/cms/auth');
await setInitialPassword('16mm-Panel-Test-Only-2026');
await writeFile('/tmp/16mm-admin-preview-path', directory);
console.log('Yalıtılmış test paneli veritabanı hazır.');
