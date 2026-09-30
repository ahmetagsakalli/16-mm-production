import { createDatabase } from './sql';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { projectSchema, settingsSchema, CmsError, type ProjectDraft, type ProjectRecord, type Media, type Settings, type ProjectSummary } from './types';
import { site, copy } from '../../content/site';
import type { Project } from '../../content/projects';
type Row = {
    id: string;
    source_folder: string;
    draft: string;
    published: string | null;
    version: number;
    deleted: number;
    updated_at: number;
    published_at: number | null;
};
export const dataDirectory = () => resolve(process.env.CMS_DATA_DIR || join(process.cwd(), '.data'));
const connections = new Map<string, DatabaseSync>();
function localDatabase() {
    const directory = dataDirectory();
    const existing = connections.get(directory);
    if (existing)
        return existing;
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    chmodSync(directory, 0o700);
    const database = new DatabaseSync(join(directory, 'cms.sqlite'));
    database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, source_folder TEXT NOT NULL, draft TEXT NOT NULL, published TEXT, version INTEGER NOT NULL DEFAULT 1, deleted INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, published_at INTEGER);
    CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS revisions(id INTEGER PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), body TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS credentials(id INTEGER PRIMARY KEY CHECK(id=1), hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, action TEXT NOT NULL, target TEXT, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS redirects(slug TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id));
    CREATE TABLE IF NOT EXISTS cloud_uploads(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, lease_until INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS media_project_id ON media(project_id);
    CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY CHECK(id=1), owner TEXT NOT NULL, expires INTEGER NOT NULL);
  `);
    chmodSync(join(directory, 'cms.sqlite'), 0o600);
    connections.set(directory, database);
    try {
        seed(database);
    }
    catch (error) {
        connections.delete(directory);
        database.close();
        throw error;
    }
    return database;
}
export const { db, transaction } = createDatabase(localDatabase);
function seed(database: DatabaseSync) {
    const gallery = JSON.parse(readFileSync(join(process.cwd(), 'src/content/gallery.json'), 'utf8')) as typeof import('../../content/gallery.json');
    database.exec('BEGIN IMMEDIATE');
    try {
        for (const [order, source] of gallery.projects.entries()) {
            const id = `gallery-${createHash('sha256').update(source.sourceFolder).digest('hex').slice(0, 20)}`;
            const media: Media[] = source.photoKeys.map((key, index) => ({ id: `${id}-${key}`, projectId: id, kind: 'image', name: `${source.title.tr} / ${index + 1}`, image: gallery.images[key as keyof typeof gallery.images], bytes: 0, originalBytes: 0, uploaded: false }));
            for (const video of source.videos)
                media.push({ id: (database.prepare("SELECT id FROM media WHERE project_id=? AND json_extract(data,'$.src')=?").get(id, video.src)?.id as string | undefined) || `${id}-video-${createHash('sha256').update(video.src).digest('hex').slice(0, 16)}`, projectId: id, kind: 'video', name: video.title, image: gallery.images[video.posterKey as keyof typeof gallery.images], src: video.src, previewSrc: video.previewSrc, bytes: video.bytes, originalBytes: 0, uploaded: false });
            const existing = database.prepare('SELECT draft FROM projects WHERE id=?').get(id);
            if (existing) {
                const draft = JSON.parse(existing.draft as string) as ProjectDraft;
                let added = 0;
                for (const item of media) {
                    const result = database.prepare('INSERT OR IGNORE INTO media VALUES(?,?,?)').run(item.id, id, JSON.stringify(item));
                    if (result.changes) {
                        draft.media.push({ id: item.id, alt: item.name, visible: true });
                        added++;
                    }
                }
                if (added)
                    database.prepare('UPDATE projects SET draft=?,version=version+1,updated_at=? WHERE id=?').run(JSON.stringify(draft), Date.now(), id);
                continue;
            }
            const draft: ProjectDraft = { title: source.title.tr, slug: source.slug, description: source.description.tr, categories: source.categories as ProjectDraft['categories'], coverId: media.find(m => m.id === `${id}-${source.coverKey}`)?.id || media[0].id, media: media.map((m, i) => ({ id: m.id, alt: `${source.title.tr} — ${m.kind === 'video' ? 'film' : `fotoğraf ${i + 1}`}`, visible: true })), order, featured: /Toskana|Acıbadem|Hilltown/.test(source.sourceFolder) };
            const json = JSON.stringify(draft), now = Date.now();
            database.prepare('INSERT INTO projects(id,source_folder,draft,published,updated_at,published_at) VALUES(?,?,?,?,?,?)').run(id, source.sourceFolder, json, json, now, now);
            for (const item of media)
                database.prepare('INSERT INTO media VALUES(?,?,?)').run(item.id, id, JSON.stringify(item));
            database.prepare('INSERT INTO revisions(project_id,body,created_at) VALUES(?,?,?)').run(id, json, now);
        }
        database.prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(1,?)').run(JSON.stringify({ ...site.contact, heroLine1: copy.tr.heroLine1, heroLine2: copy.tr.heroLine2, description: site.description.tr }));
        database.exec('COMMIT');
    }
    catch (error) {
        database.exec('ROLLBACK');
        throw error;
    }
}
export async function audit(action: string, target = '') { await db().prepare('INSERT INTO events(action,target,created_at) VALUES(?,?,?)').run(action, target, Date.now()); }
const recordQuery = `SELECT p.*, (SELECT json_group_array(json(m.data)) FROM media m WHERE m.project_id=p.id) AS assets FROM projects p`;
function recordFromRow(row: Row & { assets: string }): ProjectRecord {
    return { id: row.id, sourceFolder: row.source_folder, draft: JSON.parse(row.draft), published: row.published ? JSON.parse(row.published) : null, version: row.version, deleted: !!row.deleted, updatedAt: row.updated_at, publishedAt: row.published_at, media: JSON.parse(row.assets) };
}
export async function getProjectRecord(id: string): Promise<ProjectRecord> {
    const row = await db().prepare(`${recordQuery} WHERE p.id=?`).get(id);
    if (!row) throw new CmsError('Proje bulunamadı.', 404);
    return recordFromRow(row as unknown as Row & { assets: string });
}
async function records(where = '', order = 'p.updated_at DESC'): Promise<ProjectRecord[]> {
    return (await db().prepare(`${recordQuery} ${where} ORDER BY ${order}`).all()).map(row => recordFromRow(row as unknown as Row & { assets: string }));
}
export async function listProjects(): Promise<ProjectSummary[]> {
    return (await records()).map(p => {
        const { draft, published, media, ...base } = p;
        return { ...base, title: draft.title, slug: draft.slug, categories: draft.categories, cover: media.find(m => m.id === draft.coverId)?.image.src || '', photoCount: media.filter(m => m.kind === 'image').length, videoCount: media.filter(m => m.kind === 'video').length, status: !published ? 'draft' : JSON.stringify(draft) === JSON.stringify(published) ? 'published' : 'changed', order: draft.order };
    });
}
export async function createProject() {
    const id = randomUUID();
    const draft: ProjectDraft = { title: 'Yeni proje', slug: `yeni-proje-${id.slice(0, 8)}`, description: '', categories: ['architecture'], coverId: '', media: [], order: (await listProjects()).length, featured: false };
    await db().prepare('INSERT INTO projects(id,source_folder,draft,updated_at) VALUES(?,?,?,?)').run(id, `Panel/${id}`, JSON.stringify(draft), Date.now());
    await audit('project.create', id);
    return await getProjectRecord(id);
}
function checkVersion(project: ProjectRecord, version: number) {
    if (project.version !== version)
        throw new CmsError('Bu proje başka bir sekmede değişti. Değişikliklerinizi kopyalayıp sayfayı yenileyin.', 409);
}
function validateDraft(project: ProjectRecord, input: unknown) {
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success)
        throw new CmsError(parsed.error.issues[0].message);
    const draft = parsed.data, ids = new Set(project.media.map(m => m.id));
    if (new Set(draft.media.map(m => m.id)).size !== draft.media.length || draft.media.some(m => !ids.has(m.id)))
        throw new CmsError('Galeri dosyaları bu projeye ait olmalı.');
    if (draft.coverId && (!ids.has(draft.coverId) || !draft.media.some(m => m.id === draft.coverId && m.visible)))
        throw new CmsError('Kapak, galeride gösterilen bir görsel olmalı.');
    // Hidden files remain in the media catalog and can always be restored.
    for (const media of project.media)
        if (!draft.media.some(m => m.id === media.id))
            draft.media.push({ id: media.id, alt: media.name, visible: false });
    return draft;
}
export async function saveProject(id: string, version: number, input: unknown, publish = false) {
    return await transaction(async () => {
        const project = await getProjectRecord(id);
        checkVersion(project, version);
        if (project.deleted)
            throw new CmsError('Önce projeyi çöp kutusundan geri alın.');
        const edits = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
        const draft = validateDraft(project, { slug: project.draft.slug, description: project.draft.description, ...edits });
        // The simple editor only sends content. Existing public addresses stay stable.
        if (!Object.hasOwn(edits, 'slug') && !project.publishedAt && project.sourceFolder.startsWith('Panel/')) {
            const base = draft.title.toLocaleLowerCase('tr').replaceAll('ı', 'i').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 140).replace(/-+$/, '');
            draft.slug = `${base || 'proje'}-${id.slice(0, 8)}`;
        }
        const description = (title: string) => `${title} — ${site.name}. Fotoğraf ve film çalışmaları.`;
        if (!Object.hasOwn(edits, 'description') && (!draft.description || draft.description === description(project.draft.title) || draft.description === `${project.draft.title} — Fotoğraf ve film çalışmaları.`))
            draft.description = description(draft.title);
        if (publish) {
            if (!draft.coverId || !draft.media.some(m => m.visible))
                throw new CmsError('Yayınlamak için görsel yükleyip bir kapak seçin.');
            const collision = await db().prepare('SELECT id FROM projects WHERE id<>? AND published IS NOT NULL AND json_extract(published,\'$.slug\')=?').get(id, draft.slug);
            const redirect = await db().prepare('SELECT project_id FROM redirects WHERE slug=? AND project_id<>?').get(draft.slug, id);
            if (collision || redirect)
                throw new CmsError('Bu proje adresi zaten kullanılıyor.', 409);
            if (project.published && project.published.slug !== draft.slug)
                await db().prepare('INSERT OR REPLACE INTO redirects VALUES(?,?)').run(project.published.slug, id);
            await db().prepare('INSERT INTO revisions(project_id,body,created_at) VALUES(?,?,?)').run(id, JSON.stringify(draft), Date.now());
        }
        await db().prepare('UPDATE projects SET draft=?,published=?,version=version+1,updated_at=?,published_at=? WHERE id=?').run(JSON.stringify(draft), publish ? JSON.stringify(draft) : project.published ? JSON.stringify(project.published) : null, Date.now(), publish ? Date.now() : project.publishedAt, id);
        await audit(publish ? 'project.publish' : 'project.save', id);
        return await getProjectRecord(id);
    });
}
export async function setDeleted(id: string, version: number, deleted: boolean) {
    return await transaction(async () => {
        const p = await getProjectRecord(id);
        checkVersion(p, version);
        await db().prepare('UPDATE projects SET deleted=?,published=NULL,version=version+1,updated_at=? WHERE id=?').run(deleted ? 1 : 0, Date.now(), id);
        await audit(deleted ? 'project.trash' : 'project.restore', id);
        return await getProjectRecord(id);
    });
}
export async function revisions(id: string) { await getProjectRecord(id); return await db().prepare('SELECT id,created_at AS createdAt FROM revisions WHERE project_id=? ORDER BY id DESC LIMIT 30').all(id); }
export async function restoreRevision(id: string, version: number, revision: number) {
    const row = await db().prepare('SELECT body FROM revisions WHERE id=? AND project_id=?').get(revision, id);
    if (!row)
        throw new CmsError('Sürüm bulunamadı.', 404);
    return await saveProject(id, version, JSON.parse(row.body as string));
}
export async function addMedia(id: string, item: Media) {
    return await transaction(async () => {
        const p = await getProjectRecord(id);
        if (p.deleted)
            throw new CmsError('Silinmiş projeye yükleme yapılamaz.');
        await db().prepare('INSERT INTO media VALUES(?,?,?)').run(item.id, id, JSON.stringify(item));
        p.draft.media.push({ id: item.id, alt: item.name.replace(/\.[^.]+$/, ''), visible: true });
        if (!p.draft.coverId)
            p.draft.coverId = item.id;
        await db().prepare('UPDATE projects SET draft=?,version=version+1,updated_at=? WHERE id=?').run(JSON.stringify(p.draft), Date.now(), id);
        await audit('media.upload', id);
        return await getProjectRecord(id);
    });
}
export async function getSettings(): Promise<{
    data: Settings;
    version: number;
}> { const row = (await db().prepare('SELECT data,version FROM settings WHERE id=1').get())!; return { data: JSON.parse(row.data as string), version: row.version as number }; }
export async function saveSettings(version: number, input: unknown) {
    const edits = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
    const parsed = settingsSchema.safeParse({ description: (await getSettings()).data.description, ...edits });
    if (!parsed.success)
        throw new CmsError(parsed.error.issues[0].message);
    const result = await db().prepare('UPDATE settings SET data=?,version=version+1 WHERE id=1 AND version=?').run(JSON.stringify(parsed.data), version);
    if (!result.changes)
        throw new CmsError('Ayarlar başka bir sekmede değişti. Sayfayı yenileyin.', 409);
    await audit('settings.publish');
    return await getSettings();
}
export function toPublicProject(record: ProjectRecord, draft = false): Project | null {
    const body = draft ? record.draft : record.published;
    if (!body || (!draft && record.deleted))
        return null;
    const media = body.media.filter(m => m.visible).flatMap(m => { const asset = record.media.find(a => a.id === m.id); return asset ? [{ ...asset, alt: { tr: m.alt || body.title } }] : []; });
    const cover = media.find(m => m.id === body.coverId) || media[0];
    if (!cover)
        return null;
    const photo = (m: typeof cover) => ({ key: m.id, image: m.image, alt: m.alt });
    const videos = media.filter(m => m.kind === 'video').map(m => ({ src: m.src!, previewSrc: m.previewSrc!, title: m.alt.tr, poster: photo(m) }));
    return { slug: body.slug, sourceFolder: record.sourceFolder, title: { tr: body.title }, description: { tr: body.description }, category: body.categories[0], categories: body.categories, cover: photo(cover), photos: media.filter(m => m.kind === 'image').map(photo), videos, video: videos[0] };
}
export async function publishedProjects(): Promise<Project[]> {
    return (await records('WHERE p.deleted=0 AND p.published IS NOT NULL', "CAST(json_extract(p.published,'$.order') AS INTEGER),p.id")).flatMap(record => {
        const project = toPublicProject(record); return project ? [project] : [];
    });
}
export async function hasPublishedProject(slug: string) {
    return !!await db().prepare("SELECT 1 FROM projects WHERE deleted=0 AND published IS NOT NULL AND json_extract(published,'$.slug')=? LIMIT 1").get(slug);
}
export async function featuredSlugs() { return (await db().prepare('SELECT published FROM projects WHERE deleted=0 AND published IS NOT NULL ORDER BY CAST(json_extract(published,\'$.order\') AS INTEGER)').all()).map(r => JSON.parse(r.published as string) as ProjectDraft).filter(p => p.featured).map(p => p.slug); }
export async function redirectedSlug(slug: string) { const row = await db().prepare('SELECT p.published FROM redirects r JOIN projects p ON p.id=r.project_id WHERE r.slug=? AND p.deleted=0 AND p.published IS NOT NULL').get(slug); return row ? (JSON.parse(row.published as string) as ProjectDraft).slug : null; }
export async function mediaIsPublic(asset: Media) { const p = await getProjectRecord(asset.projectId); return !p.deleted && !!p.published?.media.some(m => m.id === asset.id && m.visible); }
export async function findMedia(id: string): Promise<Media | undefined> { const row = await db().prepare('SELECT data FROM media WHERE id=?').get(id); return row ? JSON.parse(row.data as string) : undefined; }
export async function exportContent() { return { format: '16mm-cms-v1', exportedAt: new Date().toISOString(), settings: (await getSettings()).data, projects: await records(), revisions: await db().prepare('SELECT * FROM revisions').all() }; }
