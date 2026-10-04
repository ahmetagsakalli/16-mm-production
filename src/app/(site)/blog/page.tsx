import Link from 'next/link';
import { getPublicBlogPosts } from '@/lib/cms/public';
import { pageMetadata } from '@/lib/metadata';
import { Photo } from '@/components/Photo';
import s from '@/components/Portfolio.module.css';
import b from '@/components/Blog.module.css';
export const revalidate = 3600;
export const metadata = pageMetadata('/blog', 'Blog', 'Mimari, otel, mağaza ve ürün fotoğrafçılığı üzerine notlar. Çekim hazırlığı, ışık ve görsel anlatım hakkında 16mm Production yazıları.');
export default async function Blog() {
  const posts = await getPublicBlogPosts();
  return <main id="main"><h1 className={s.pageHeading}>Blog</h1><div className={b.grid}>{posts.map(post=><Link href={`/blog/${post.slug}`} className={b.card} key={post.id}>{post.cover&&<div className={b.cardPhoto}><Photo photo={{key:post.cover.id,image:post.cover.image,alt:{tr:post.title}}} locale="tr" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 40vw"/></div>}<p className={b.date}>{new Date(post.publishedAt).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Istanbul'})}</p><h2>{post.title}</h2><p>{post.excerpt}</p><span className={b.read}>Yazıyı oku ↗</span></Link>)}</div>{!posts.length&&<p className={b.empty}>Yeni yazılar hazırlanıyor.</p>}</main>;
}
