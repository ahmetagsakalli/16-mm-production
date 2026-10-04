import { randomUUID } from 'node:crypto';
import { db, transaction, audit, records, toPublicProject } from './store';
import { blogSchema, homepageSchema, CmsError, type BlogRecord, type BlogDraft, type PublicBlogPost, type HomepageRecord, type MediaOption, type ProjectOption } from './types';
import homeSlides from '../../content/home-slides.json';

export async function mediaOptions(): Promise<MediaOption[]> {
  return (await records('WHERE p.deleted=0 AND p.published IS NOT NULL')).flatMap(p => {
    const body = p.published!;
    return body.media.filter(m => m.visible).flatMap(m => {
      const asset = p.media.find(a => a.id === m.id && a.kind === 'image');
      return asset ? [{ id: asset.id, projectId: p.id, projectTitle: body.title, name: m.alt || asset.name, image: asset.image }] : [];
    });
  });
}
export async function publishedProjectOptions(): Promise<ProjectOption[]> {
  return (await records('WHERE p.deleted=0 AND p.published IS NOT NULL', "CAST(json_extract(p.published,'$.order') AS INTEGER),p.id")).flatMap(p => {
    const project = toPublicProject(p);
    return project ? [{ id: p.id, title: project.title.tr, slug: project.slug, cover: project.cover.image.src }] : [];
  });
}
export async function getHomepage(): Promise<HomepageRecord> {
  const row = await db().prepare('SELECT data,version FROM homepage WHERE id=1').get();
  if (row) return { data: JSON.parse(row.data as string), version: Number(row.version) };
  const all = await records('WHERE p.deleted=0 AND p.published IS NOT NULL', "CAST(json_extract(p.published,'$.order') AS INTEGER),p.id");
  const photos = await mediaOptions();
  return { data: {
    slides: homeSlides.flatMap(slide => { const photo = photos.find(p => p.image.src === slide.originalSrc); return photo ? [photo.id] : []; }),
    projects: all.filter(p => p.published?.featured).slice(0, 6).map(p => p.id),
  }, version: 0 };
}
export async function saveHomepage(version: number, input: unknown) {
  return transaction(async () => {
    const current = await getHomepage();
    if (current.version !== version) throw new CmsError('Ana sayfa başka bir sekmede değişti. Sayfayı yenileyin.', 409);
    const parsed = homepageSchema.safeParse(input);
    if (!parsed.success) throw new CmsError(parsed.error.issues[0].message);
    const { slides, projects } = parsed.data;
    const [photos, available] = await Promise.all([mediaOptions(), publishedProjectOptions()]);
    if (new Set(slides).size !== slides.length || slides.some(id => !photos.some(p => p.id === id))) throw new CmsError('Ana sayfa için yayındaki projelerden görünür fotoğraflar seçin.');
    if (new Set(projects).size !== projects.length || projects.some(id => !available.some(p => p.id === id))) throw new CmsError('Seçili projeler yayında olmalı ve tekrar etmemeli.');
    if (version === 0) await db().prepare('INSERT INTO homepage(id,data) VALUES(1,?)').run(JSON.stringify(parsed.data));
    else await db().prepare('UPDATE homepage SET data=?,version=version+1 WHERE id=1').run(JSON.stringify(parsed.data));
    await audit('homepage.publish');
    return getHomepage();
  });
}
export async function publicHomepage() {
  const [home, photos, projects] = await Promise.all([getHomepage(), mediaOptions(), publishedProjectOptions()]);
  return {
    photos: home.data.slides.flatMap(id => {
      const photo = photos.find(p => p.id === id);
      if (!photo) return [];
      const enhanced = homeSlides.find(slide => slide.originalSrc === photo.image.src);
      return [{ key: photo.id, alt: { tr: photo.name }, image: enhanced?.image || photo.image }];
    }),
    slugs: home.data.projects.flatMap(id => { const project = projects.find(p => p.id === id); return project ? [project.slug] : []; }),
  };
}
function blogFromRow(row: Record<string, unknown>): BlogRecord {
  return { id: String(row.id), draft: JSON.parse(String(row.draft)), published: row.published ? JSON.parse(String(row.published)) : null, version: Number(row.version), deleted: !!row.deleted, updatedAt: Number(row.updated_at), publishedAt: row.published_at ? Number(row.published_at) : null };
}
export async function listBlogPosts(): Promise<BlogRecord[]> { return (await db().prepare('SELECT * FROM blog_posts ORDER BY updated_at DESC,id').all()).map(blogFromRow); }
export async function getBlogPost(id: string): Promise<BlogRecord> {
  const row = await db().prepare('SELECT * FROM blog_posts WHERE id=?').get(id);
  if (!row) throw new CmsError('Yazı bulunamadı.', 404);
  return blogFromRow(row);
}
export async function createBlogPost() {
  const id = randomUUID();
  const draft: BlogDraft = { title: 'Yeni yazı', slug: `yazi-${id}`, excerpt: '', body: '', coverId: '' };
  await db().prepare('INSERT INTO blog_posts(id,draft,updated_at) VALUES(?,?,?)').run(id, JSON.stringify(draft), Date.now());
  await audit('blog.create', id);
  return getBlogPost(id);
}
export async function saveBlogPost(id: string, version: number, input: unknown, publish = false) {
  return transaction(async () => {
    const post = await getBlogPost(id);
    if (post.version !== version) throw new CmsError('Bu yazı başka bir sekmede değişti. Değişikliklerinizi kopyalayıp sayfayı yenileyin.', 409);
    if (post.deleted) throw new CmsError('Önce yazıyı çöp kutusundan geri alın.');
    const parsed = blogSchema.safeParse(input);
    if (!parsed.success) throw new CmsError(parsed.error.issues[0].message);
    const value = parsed.data;
    if (value.coverId && !(await mediaOptions()).some(p => p.id === value.coverId)) throw new CmsError('Yazı kapağı için yayındaki bir fotoğrafı seçin.');
    if (publish && value.body.length < 80) throw new CmsError('Yayınlamadan önce yazı metnini tamamlayın (en az 80 karakter).');
    const base = value.title.toLocaleLowerCase('tr').replaceAll('ı', 'i').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 130).replace(/-+$/, '');
    const draft: BlogDraft = { ...value, slug: post.publishedAt ? post.draft.slug : `${base || 'yazi'}-${id}` };
    const now = Date.now();
    await db().prepare('UPDATE blog_posts SET draft=?,published=?,version=version+1,updated_at=?,published_at=? WHERE id=?').run(JSON.stringify(draft), publish ? JSON.stringify(draft) : post.published ? JSON.stringify(post.published) : null, now, publish ? post.publishedAt || now : post.publishedAt, id);
    await audit(publish ? 'blog.publish' : 'blog.save', id);
    return getBlogPost(id);
  });
}
export async function setBlogState(id: string, version: number, action: 'trash' | 'restore' | 'unpublish') {
  return transaction(async () => {
    const post = await getBlogPost(id);
    if (post.version !== version) throw new CmsError('Yazı başka bir sekmede değişti. Sayfayı yenileyin.', 409);
    await db().prepare('UPDATE blog_posts SET deleted=?,published=NULL,version=version+1,updated_at=? WHERE id=?').run(action === 'trash' ? 1 : action === 'restore' ? 0 : Number(post.deleted), Date.now(), id);
    await audit(`blog.${action}`, id);
    return getBlogPost(id);
  });
}
export async function publicBlogPosts(): Promise<PublicBlogPost[]> {
  const [rows, photos] = await Promise.all([db().prepare('SELECT * FROM blog_posts WHERE deleted=0 AND published IS NOT NULL ORDER BY published_at DESC,id').all(), mediaOptions()]);
  return rows.map(row => { const p = blogFromRow(row); return { ...p.published!, id: p.id, cover: photos.find(photo => photo.id === p.published!.coverId), publishedAt: p.publishedAt!, updatedAt: p.updatedAt }; });
}
