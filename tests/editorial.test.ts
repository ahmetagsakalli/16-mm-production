import { after, afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BlogInput, BlogRecord, Media, ProjectRecord } from '../src/lib/cms/types';
import { starterPosts } from '../src/content/starter-blog';

// Set these before importing the adapter: it selects its remote client at import time.
const environmentKeys = ['CMS_DATA_DIR', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'BLOB_READ_WRITE_TOKEN', 'VERCEL'] as const;
const previousEnvironment = new Map(environmentKeys.map(key => [key, process.env[key]]));
for (const key of environmentKeys) delete process.env[key];
const store = await import('../src/lib/cms/store');
const editorial = await import('../src/lib/cms/editorial');
const { initializeEditorial } = await import('../src/lib/cms/initialize-editorial');
const { CmsError } = await import('../src/lib/cms/types');

after(() => {
  for (const [key, value] of previousEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const inputOf = ({ draft }: BlogRecord): BlogInput => {
  const { title, excerpt, body, coverId } = draft;
  return { title, excerpt, body, coverId };
};
const article = (overrides: Partial<BlogInput> = {}): BlogInput => ({
  title: 'Işık ve İç Mekân', excerpt: 'Çekim hazırlığı üzerine kısa notlar.',
  body: 'Mekân çekiminde ışığın yönünü ve yüzeylerin dokusunu gözlemlemek, anlatımı güçlendiren tutarlı bir fotoğraf serisi oluşturur.',
  coverId: '', ...overrides,
});
const cmsError = (status: number, message?: RegExp) => (error: unknown) => {
  assert.ok(error instanceof CmsError);
  assert.equal(error.status, status);
  if (message) assert.match(error.message, message);
  return true;
};

async function fixtureProject(publish = true): Promise<ProjectRecord> {
  let project = await store.createProject();
  for (let index = 0; index < 4; index++) {
    const id = `${project.id}-fixture-${index}`;
    const kind = index === 3 ? 'video' : 'image';
    const asset: Media = {
      id, projectId: project.id, name: `Fixture ${index}`, kind,
      image: { src: `/test-only/${id}.webp`, width: 80, height: 60, bytes: 1, totalBytes: 1, blurDataURL: '' },
      bytes: 1, originalBytes: 1, uploaded: false,
      ...(kind === 'video' ? { src: `/test-only/${id}.mp4`, previewSrc: `/test-only/${id}-preview.mp4` } : {}),
    };
    project = await store.addMedia(project.id, asset);
  }
  return publish ? store.saveProject(project.id, project.version, project.draft, true) : project;
}

async function coreSnapshot() {
  const tables = ['projects', 'media', 'revisions', 'settings', 'credentials', 'sessions', 'attempts', 'events', 'redirects', 'cloud_uploads', 'jobs'];
  return Object.fromEntries(await Promise.all(tables.map(async table => [table, await store.db().prepare(`SELECT * FROM ${table} ORDER BY 1`).all()])));
}

describe('editorial content in isolated local databases', { concurrency: false }, () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), '16mm-editorial-test-'));
    process.env.CMS_DATA_DIR = directory;
    for (const key of environmentKeys.filter(key => key !== 'CMS_DATA_DIR')) delete process.env[key];
    // Eager initialization keeps even a failed assertion's cleanup in this test directory.
    await store.db().prepare('SELECT 1').get();
    assert.equal(store.dataDirectory(), directory);
  });
  afterEach(async () => {
    store.db().close();
    await rm(directory, { recursive: true, force: true });
  });

  test('initialization preserves all core records and reruns preserve edited editorial content', async () => {
    let project = await fixtureProject();
    project = await store.saveProject(project.id, project.version, { ...project.draft, title: 'Unpublished project edits' });
    const settings = await store.getSettings();
    await store.saveSettings(settings.version, { ...settings.data, email: 'fixture@example.test', about: 'Existing custom biography.' });
    await store.db().prepare('INSERT INTO credentials VALUES(1,?)').run('fixture-hash');
    await store.db().prepare('INSERT INTO sessions VALUES(?,?)').run('fixture-session', 123456);
    await store.db().prepare('INSERT INTO attempts VALUES(?,?,?)').run('fixture-attempt', 2, 123456);
    await store.db().prepare('INSERT INTO redirects VALUES(?,?)').run('fixture-old-address', project.id);
    await store.db().prepare('INSERT INTO jobs VALUES(1,?,?)').run('fixture-job', 123456);
    const before = await coreSnapshot();
    const fallbackHome = await editorial.getHomepage();
    assert.equal(fallbackHome.version, 0);
    assert.deepEqual(await initializeEditorial(), { initialized: true, addedPosts: starterPosts.length, projectsUntouched: true });
    assert.deepEqual(await coreSnapshot(), before);
    assert.deepEqual((await editorial.getHomepage()).data, fallbackHome.data);
    assert.equal((await editorial.publicBlogPosts()).length, starterPosts.length);
    for (const starter of starterPosts) {
      const post = await editorial.getBlogPost(starter.id);
      assert.equal(post.published?.slug, starter.slug);
      assert.equal(post.published?.body, starter.body);
    }

    const home = await editorial.getHomepage();
    await editorial.saveHomepage(home.version, { slides: [project.draft.coverId], projects: [project.id] });
    const post = await editorial.getBlogPost(starterPosts[0].id);
    await editorial.saveBlogPost(post.id, post.version, { ...inputOf(post), title: 'Editor revised this starter article' });
    const editorialBefore = { home: await editorial.getHomepage(), posts: await editorial.listBlogPosts(), migration: await store.db().prepare('SELECT * FROM editorial_migrations').all() };
    const coreBeforeRerun = await coreSnapshot();
    assert.deepEqual(await initializeEditorial(), { initialized: false, reason: 'already initialized' });
    assert.deepEqual({ home: await editorial.getHomepage(), posts: await editorial.listBlogPosts(), migration: await store.db().prepare('SELECT * FROM editorial_migrations').all() }, editorialBefore);
    assert.deepEqual(await coreSnapshot(), coreBeforeRerun);
  });

  test('first migration preserves an already configured homepage and preexisting starter ID', async () => {
    const project = await fixtureProject();
    const home = await editorial.saveHomepage(0, { slides: [project.draft.media[1].id], projects: [project.id] });
    const custom = { ...article({ title: 'Existing custom content' }), slug: 'existing-stable-address' };
    await store.db().prepare('INSERT INTO blog_posts(id,draft,updated_at) VALUES(?,?,?)').run(starterPosts[0].id, JSON.stringify(custom), 123);
    const existing = await editorial.getBlogPost(starterPosts[0].id);
    assert.deepEqual(await initializeEditorial(), { initialized: true, addedPosts: starterPosts.length - 1, projectsUntouched: true });
    assert.deepEqual(await editorial.getHomepage(), home);
    assert.deepEqual(await editorial.getBlogPost(existing.id), existing);
    assert.equal((await editorial.publicBlogPosts()).some(post => post.id === existing.id), false);
  });

  test('homepage photo and project order survives saving without modifying project galleries', async () => {
    const first = await fixtureProject(), second = await fixtureProject();
    const before = [await store.getProjectRecord(first.id), await store.getProjectRecord(second.id)];
    const data = { slides: [second.draft.media[2].id, first.draft.media[1].id, second.draft.media[0].id], projects: [second.id, first.id] };
    const saved = await editorial.saveHomepage(0, data);
    assert.equal(saved.version, 1);
    assert.deepEqual(saved.data, data);
    assert.deepEqual(await editorial.getHomepage(), saved);
    const publicHome = await editorial.publicHomepage();
    assert.deepEqual(publicHome.photos.map(photo => photo.key), data.slides);
    assert.deepEqual(publicHome.slugs, [second.published!.slug, first.published!.slug]);
    assert.deepEqual([await store.getProjectRecord(first.id), await store.getProjectRecord(second.id)], before);
  });

  test('homepage accepts only distinct visible published photos and published projects, then filters withdrawn content', async () => {
    let published = await fixtureProject();
    const draft = await fixtureProject(false);
    const selected = published.draft.media[1].id, video = published.draft.media[3].id;
    const saved = await editorial.saveHomepage(0, { slides: [selected], projects: [published.id] });
    const invalid = [
      { slides: [], projects: [] },
      { slides: [selected, selected], projects: [] },
      { slides: [video], projects: [] },
      { slides: [draft.draft.coverId], projects: [] },
      { slides: ['unknown-photo'], projects: [] },
      { slides: [selected], projects: [draft.id] },
      { slides: [selected], projects: [published.id, published.id] },
      { slides: [selected], projects: ['unknown-project'] },
      { slides: Array(41).fill(selected), projects: [] },
      { slides: [selected], projects: Array(13).fill(published.id) },
    ];
    for (const input of invalid) {
      await assert.rejects(editorial.saveHomepage(saved.version, input), cmsError(400));
      assert.deepEqual(await editorial.getHomepage(), saved);
    }
    published = await store.saveProject(published.id, published.version, { ...published.draft, media: published.draft.media.map(media => media.id === selected ? { ...media, visible: false } : media) });
    assert.equal((await editorial.mediaOptions()).some(photo => photo.id === selected), true, 'draft visibility must not affect public selectors');
    published = await store.saveProject(published.id, published.version, published.draft, true);
    assert.equal((await editorial.mediaOptions()).some(photo => photo.id === selected), false);
    assert.deepEqual((await editorial.publicHomepage()).photos, []);
    await assert.rejects(editorial.saveHomepage(saved.version, saved.data), cmsError(400));
    await store.setDeleted(published.id, published.version, true);
    assert.deepEqual(await editorial.publicHomepage(), { photos: [], slugs: [] });
    assert.equal((await editorial.publishedProjectOptions()).some(project => project.id === published.id), false);
  });

  test('homepage concurrent initial and later saves each allow one writer and reject stale changes', async () => {
    const project = await fixtureProject();
    for (const version of [0, 1]) {
      const choices = [project.draft.media[0].id, project.draft.media[1].id];
      const results = await Promise.allSettled(choices.map(id => editorial.saveHomepage(version, { slides: [id], projects: [project.id] })));
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      const failure = results.find(result => result.status === 'rejected');
      assert.ok(failure?.status === 'rejected');
      cmsError(409, /başka bir sekmede/)(failure.reason);
      const winner = results.find(result => result.status === 'fulfilled');
      assert.ok(winner?.status === 'fulfilled');
      assert.deepEqual(await editorial.getHomepage(), winner.value);
      assert.equal(winner.value.version, version + 1);
    }
  });

  test('selecting and publishing a different project cover preserves gallery order and metadata', async () => {
    let project = await fixtureProject();
    const orderedMedia = [project.draft.media[2], project.draft.media[0], project.draft.media[3], project.draft.media[1]];
    project = await store.saveProject(project.id, project.version, { ...project.draft, media: orderedMedia }, true);
    const originalPublic = store.toPublicProject(project)!;
    const newCover = project.draft.media.at(-1)!.id;
    project = await store.saveProject(project.id, project.version, { ...project.draft, coverId: newCover });
    assert.equal(store.toPublicProject(project)!.cover.key, originalPublic.cover.key);
    assert.deepEqual(project.draft.media, orderedMedia);
    project = await store.saveProject(project.id, project.version, project.draft, true);
    assert.equal(store.toPublicProject(project)!.cover.key, newCover);
    assert.deepEqual(store.toPublicProject(project)!.photos, originalPublic.photos);
    assert.deepEqual(store.toPublicProject(project)!.videos, originalPublic.videos);
    assert.deepEqual(project.draft.media, orderedMedia);
  });

  test('blog drafts stay private; publication, withdrawal, trash and restore retain content and stable addresses', async () => {
    const project = await fixtureProject();
    let post = await editorial.createBlogPost();
    const id = post.id;
    assert.equal(post.published, null);
    assert.equal(post.version, 1);
    post = await editorial.saveBlogPost(id, post.version, article({ coverId: project.draft.coverId }));
    assert.equal(post.draft.slug, `isik-ve-ic-mekan-${id}`);
    assert.deepEqual(await editorial.publicBlogPosts(), []);
    post = await editorial.saveBlogPost(id, post.version, inputOf(post), true);
    const slug = post.draft.slug, publishedAt = post.publishedAt, firstPublished = post.published;
    assert.ok(publishedAt);
    assert.equal((await editorial.publicBlogPosts())[0].cover?.id, project.draft.coverId);
    post = await editorial.saveBlogPost(id, post.version, article({ title: 'Yeni başlık', body: `${post.draft.body}\n\nTaslak ek paragraf.`, coverId: project.draft.coverId }));
    assert.deepEqual(post.published, firstPublished);
    assert.equal((await editorial.publicBlogPosts())[0].title, firstPublished!.title);
    assert.equal(post.draft.slug, slug);
    post = await editorial.saveBlogPost(id, post.version, inputOf(post), true);
    assert.equal((await editorial.publicBlogPosts())[0].title, 'Yeni başlık');
    assert.equal(post.publishedAt, publishedAt);
    post = await editorial.setBlogState(id, post.version, 'unpublish');
    assert.equal(post.deleted, false);
    assert.equal(post.published, null);
    assert.deepEqual(await editorial.publicBlogPosts(), []);
    post = await editorial.saveBlogPost(id, post.version, { ...inputOf(post), title: 'Yayından sonra yeni başlık' }, true);
    assert.equal(post.draft.slug, slug);
    const retained = post.draft;
    post = await editorial.setBlogState(id, post.version, 'trash');
    assert.equal(post.deleted, true);
    assert.equal(post.published, null);
    assert.deepEqual(post.draft, retained);
    assert.deepEqual(await editorial.publicBlogPosts(), []);
    await assert.rejects(editorial.saveBlogPost(id, post.version, inputOf(post), true), cmsError(400, /çöp kutusundan/));
    post = await editorial.setBlogState(id, post.version, 'restore');
    assert.equal(post.deleted, false);
    assert.equal(post.published, null);
    assert.deepEqual(post.draft, retained);
    assert.deepEqual(await editorial.publicBlogPosts(), []);
    post = await editorial.saveBlogPost(id, post.version, { ...inputOf(post), title: 'Geri alınan yazı' }, true);
    assert.equal(post.draft.slug, slug);
    assert.equal(post.publishedAt, publishedAt);
    assert.equal((await editorial.publicBlogPosts())[0].slug, slug);
  });

  test('blog rejects malformed content and private, hidden or video covers without altering its record', async () => {
    let project = await fixtureProject();
    const draft = await fixtureProject(false);
    const hidden = project.draft.media[1].id, video = project.draft.media[3].id;
    project = await store.saveProject(project.id, project.version, { ...project.draft, media: project.draft.media.map(media => media.id === hidden ? { ...media, visible: false } : media) }, true);
    const post = await editorial.createBlogPost();
    for (const input of [article({ title: '  ' }), article({ body: ' '.repeat(100) }), article({ body: 'x'.repeat(79) }), article({ body: 'x'.repeat(50001) }), article({ excerpt: 'x'.repeat(401) }), article({ coverId: 'not-found' }), article({ coverId: draft.draft.coverId }), article({ coverId: hidden }), article({ coverId: video }), { ...article(), slug: 'manually-injected-address' }]) {
      await assert.rejects(editorial.saveBlogPost(post.id, post.version, input, true), cmsError(400));
      assert.deepEqual(await editorial.getBlogPost(post.id), post);
    }
    const saved = await editorial.saveBlogPost(post.id, post.version, article({ body: 'Short draft is allowed.' }));
    assert.equal(saved.draft.body, 'Short draft is allowed.');
    assert.equal(saved.published, null);
    await assert.rejects(editorial.getBlogPost('not-found'), cmsError(404));
  });

  test('concurrent blog saves cannot overwrite each other and stale state transitions are rejected', async () => {
    const post = await editorial.createBlogPost();
    const results = await Promise.allSettled([
      editorial.saveBlogPost(post.id, post.version, article({ title: 'First editor' })),
      editorial.saveBlogPost(post.id, post.version, article({ title: 'Second editor' })),
    ]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    const failure = results.find(result => result.status === 'rejected');
    assert.ok(failure?.status === 'rejected');
    cmsError(409, /başka bir sekmede/)(failure.reason);
    const current = await editorial.getBlogPost(post.id);
    assert.equal(current.version, post.version + 1);
    for (const action of ['trash', 'restore', 'unpublish'] as const) {
      await assert.rejects(editorial.setBlogState(post.id, post.version, action), cmsError(409));
      assert.deepEqual(await editorial.getBlogPost(post.id), current);
    }
    await assert.rejects(editorial.saveBlogPost(post.id, post.version, article(), true), cmsError(409));
    assert.deepEqual(await editorial.publicBlogPosts(), []);
  });

  test('same-title and non-Latin blog posts have distinct addresses, while withdrawn covers disappear safely', async () => {
    let project = await fixtureProject();
    const first = await editorial.createBlogPost(), second = await editorial.createBlogPost(), nonLatin = await editorial.createBlogPost();
    const one = await editorial.saveBlogPost(first.id, first.version, article({ coverId: project.draft.coverId }), true);
    const two = await editorial.saveBlogPost(second.id, second.version, article(), true);
    const three = await editorial.saveBlogPost(nonLatin.id, nonLatin.version, article({ title: '日本語 🏛️' }), true);
    assert.notEqual(one.draft.slug, two.draft.slug);
    assert.match(one.draft.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(three.draft.slug, `yazi-${nonLatin.id}`);
    assert.equal((await editorial.publicBlogPosts()).find(post => post.id === one.id)?.cover?.id, project.draft.coverId);
    project = await store.setDeleted(project.id, project.version, true);
    const publicPost = (await editorial.publicBlogPosts()).find(post => post.id === one.id)!;
    assert.equal(publicPost.cover, undefined);
    assert.equal(publicPost.body, one.published!.body);
    assert.equal((await editorial.getBlogPost(one.id)).draft.coverId, project.draft.coverId);
  });
});
