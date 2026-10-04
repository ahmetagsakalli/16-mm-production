import { z } from 'zod';
import type { ImageData } from '../images';
import { categoryIds } from '../../content/site';

export const projectSchema = z.object({
  title: z.string().trim().min(1, 'Proje adı gerekli.').max(150),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Adres yalnızca küçük harf, rakam ve tire içerebilir.'),
  description: z.string().trim().max(500),
  categories: z.array(z.enum(categoryIds)).min(1, 'En az bir çalışma alanı seçin.').max(5),
  coverId: z.string().max(200),
  media: z.array(z.object({ id: z.string().min(1).max(200), alt: z.string().trim().max(300), visible: z.boolean() })).max(2000),
  order: z.number().int().min(0).max(10000),
  featured: z.boolean(),
}).strict();
export type ProjectDraft = z.infer<typeof projectSchema>;
export type Media = { id: string; projectId: string; name: string; kind: 'image' | 'video'; image: ImageData; src?: string; previewSrc?: string; bytes: number; originalBytes: number; uploaded: boolean; storage?: { original: string; files: Record<string, string> } };
export type ProjectRecord = { id: string; sourceFolder: string; draft: ProjectDraft; published: ProjectDraft | null; version: number; deleted: boolean; updatedAt: number; publishedAt: number | null; media: Media[] };
export type ProjectSummary = Omit<ProjectRecord, 'media' | 'draft' | 'published'> & { title: string; slug: string; categories: ProjectDraft['categories']; cover: string; photoCount: number; videoCount: number; status: 'draft' | 'published' | 'changed'; order: number };
export const settingsSchema = z.object({
  email: z.union([z.literal(''), z.email().max(254)]),
  phone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/, 'Geçerli bir telefon numarası girin.'),
  instagram: z.union([z.literal(''), z.url().max(300).refine(v => /^https:\/\/(www\.)?instagram\.com\//i.test(v), 'Instagram adresi https://instagram.com/ ile başlamalı.')]),
  heroLine1: z.string().trim().min(1).max(80), heroLine2: z.string().trim().min(1).max(80),
  address: z.string().trim().max(500).optional(),
  about: z.string().trim().max(4000).optional(),
  description: z.string().trim().min(20).max(500),
}).strict();
export type Settings = z.infer<typeof settingsSchema>;
export const homepageSchema = z.object({
  slides: z.array(z.string().min(1).max(200)).min(1, 'En az bir ana sayfa fotoğrafı seçin.').max(40),
  projects: z.array(z.string().min(1).max(200)).max(12),
}).strict();
export type HomepageData = z.infer<typeof homepageSchema>;
export type HomepageRecord = { data: HomepageData; version: number };
export type MediaOption = { id: string; projectId: string; projectTitle: string; name: string; image: ImageData };
export type ProjectOption = { id: string; title: string; slug: string; cover: string };
export const blogSchema = z.object({
  title: z.string().trim().min(1, 'Yazı başlığı gerekli.').max(160),
  excerpt: z.string().trim().max(400),
  body: z.string().trim().max(50000),
  coverId: z.string().max(200),
}).strict();
export type BlogInput = z.infer<typeof blogSchema>;
export type BlogDraft = BlogInput & { slug: string };
export type BlogRecord = { id: string; draft: BlogDraft; published: BlogDraft | null; version: number; deleted: boolean; updatedAt: number; publishedAt: number | null };
export type PublicBlogPost = BlogDraft & { id: string; cover?: MediaOption; publishedAt: number; updatedAt: number };
export class CmsError extends Error { constructor(message: string, public status = 400) { super(message); } }
