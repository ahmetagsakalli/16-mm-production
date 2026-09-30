import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const base = new URL(process.argv[2] || 'http://127.0.0.1:3001');
const output = process.argv[3] || 'reports/seo-audit.json';
const sitemapResponse = await fetch(new URL('/sitemap.xml', base));
if (!sitemapResponse.ok) throw new Error(`Sitemap: ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
if (!urls.length) throw new Error('Sitemap is empty.');
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1];
const results = [];
for (const url of urls) {
  const expected = new URL(url);
  const response = await fetch(new URL(expected.pathname, base));
  const html = await response.text();
  const metas = [...html.matchAll(/<meta\s[^>]*>/gi)].map(match => match[0]);
  const links = [...html.matchAll(/<link\s[^>]*>/gi)].map(match => match[0]);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = attribute(metas.find(tag => attribute(tag, 'name') === 'description') || '', 'content');
  const canonical = attribute(links.find(tag => attribute(tag, 'rel') === 'canonical') || '', 'href');
  const robots = attribute(metas.find(tag => attribute(tag, 'name') === 'robots') || '', 'content') || '';
  const images = [...html.matchAll(/<img\s[^>]*>/gi)].map(match => match[0]);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  const errors = [];
  if (response.status !== 200) errors.push(`HTTP ${response.status}`);
  if (!title) errors.push('Missing title');
  if (!description) errors.push('Missing description');
  if (new URL(canonical || '/', expected).href !== expected.href) errors.push('Canonical mismatch');
  if (!/<html\b[^>]*\blang="tr"/.test(html)) errors.push('Missing Turkish language');
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push('Expected one H1');
  if (/noindex/i.test(robots)) errors.push('Public page is noindex');
  if (images.some(tag => !attribute(tag, 'alt'))) errors.push('Missing image description');
  if (images.some(tag => !attribute(tag, 'width') || !attribute(tag, 'height'))) errors.push('Missing image dimensions');
  if (images.some(tag => !/\.webp(?:\?|$)/.test(attribute(tag, 'src') || ''))) errors.push('Non-WebP photo');
  if (!schemas.some(schema => schema['@type'] === 'Organization' && schema.name === '16mm Production')) errors.push('Missing organization data');
  results.push({ path: expected.pathname, status: response.status, title, description, canonical, imageCount: images.length, errors });
}
const robotsResponse = await fetch(new URL('/robots.txt', base));
const robots = await robotsResponse.text();
const admin = await fetch(new URL('/admin', base));
const adminHtml = await admin.text();
const redirects = [];
for (const path of ['/tr', '/en', '/tr/contact', '/en/contact']) {
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  redirects.push({ path, status: response.status, location: response.headers.get('location') });
}
const missing = await fetch(new URL('/projects/nonexistent-seo-audit', base));
const report = {
  measuredAt: new Date().toISOString(), base: base.href, pageCount: results.length,
  passed: results.filter(result => !result.errors.length).length,
  robots: { status: robotsResponse.status, blocksAdmin: robots.includes('Disallow: /admin'), sitemapListed: robots.includes('Sitemap:') },
  adminNoindex: /noindex/.test(admin.headers.get('x-robots-tag') || '') && /name="robots" content="[^"]*noindex/.test(adminHtml),
  missingProjectStatus: missing.status,
  redirects, pages: results,
};
await mkdir(join(output, '..'), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, pages: results.filter(result => result.errors.length) }, null, 2));
if (report.passed !== report.pageCount || !report.adminNoindex || missing.status !== 404) process.exitCode = 1;
