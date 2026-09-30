import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { publishedProjects, featuredSlugs, getSettings, dataDirectory } from './store';
// Source imports and separate data directories must never reuse each other's cached content.
const sourceVersion = createHash('sha256').update(readFileSync(join(process.cwd(), 'src/content/gallery.json'))).digest('hex');
export const getPublicProjects = unstable_cache(async () => publishedProjects(), ['cms-projects-v2', dataDirectory(), sourceVersion], { tags: ['cms'], revalidate: 3600 });
// Deduplicate this inexpensive read within a render, without carrying stale
// contact details into a new build. Public pages still use Next's route cache;
// saving settings invalidates the public layout in the admin API.
export const getPublicSettings = cache(async () => getSettings().data);
export const getFeaturedSlugs = unstable_cache(async () => featuredSlugs(), ['cms-featured-v2', dataDirectory(), sourceVersion], { tags: ['cms'], revalidate: 3600 });
