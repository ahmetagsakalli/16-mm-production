import { db, transaction, records } from './store';
import { editorialSchema } from './editorial-schema';
import { getHomepage, mediaOptions } from './editorial';
import { starterPosts } from '../../content/starter-blog';
export async function initializeEditorial() {
  await db().exec(editorialSchema);
  return transaction(async () => {
    if (await db().prepare('SELECT id FROM editorial_migrations WHERE id=?').get('editorial-v1')) return { initialized: false, reason: 'already initialized' };
    const home = await getHomepage();
    await db().prepare('INSERT OR IGNORE INTO homepage(id,data) VALUES(1,?)').run(JSON.stringify(home.data));
    const [photos, projects] = await Promise.all([mediaOptions(), records('WHERE p.deleted=0 AND p.published IS NOT NULL')]);
    let added = 0;
    for (const [i, post] of starterPosts.entries()) {
      const p = projects.find(p => p.published?.title === post.projectTitle) || projects.find(p => p.published?.categories.includes(post.category));
      const cover = photos.find(photo => photo.id === p?.published?.coverId) || photos.find(photo => photo.projectId === p?.id);
      const body = JSON.stringify({ title: post.title, slug: post.slug, excerpt: post.excerpt, body: post.body, coverId: cover?.id || '' });
      const now = Date.now() - i * 1000;
      added += Number((await db().prepare('INSERT OR IGNORE INTO blog_posts(id,draft,published,updated_at,published_at) VALUES(?,?,?,?,?)').run(post.id, body, body, now, now)).changes);
    }
    await db().prepare('INSERT INTO editorial_migrations VALUES(?,?)').run('editorial-v1', Date.now());
    return { initialized: true, addedPosts: added, projectsUntouched: true };
  });
}
