import Link from 'next/link';
import type { PublicBlogPost } from '@/lib/cms/types';
import { Photo } from './Photo';
import s from './Blog.module.css';
export function BlogText({ body }: { body: string }) { return <div className={s.prose}>{body.split(/\n\s*\n/).filter(Boolean).map((block,index) => block.startsWith('## ') ? <h2 key={index}>{block.slice(3)}</h2> : <p key={index}>{block}</p>)}</div>; }
export function BlogArticle({ post }: { post: PublicBlogPost }) {
  return <article className={s.article}><Link href="/blog" className={s.back}>← Tüm yazılar</Link><header><p className={s.date}>{new Date(post.publishedAt).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Istanbul'})} · {Math.max(1,Math.ceil(post.body.split(/\s+/).length/180))} dk okuma</p><h1>{post.title}</h1>{post.excerpt&&<p className={s.intro}>{post.excerpt}</p>}</header>{post.cover&&<div className={s.cover}><Photo photo={{key:post.cover.id,image:post.cover.image,alt:{tr:post.title}}} locale="tr" priority sizes="(max-width: 900px) 100vw, 900px"/></div>}<BlogText body={post.body}/><div className={s.articleContact}><p>Bir çekim planlıyor musunuz?</p><Link href="/contact#projenizden-bahsedin">Projenizden bahsedin.</Link></div></article>;
}
