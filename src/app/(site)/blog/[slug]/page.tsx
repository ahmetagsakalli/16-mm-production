import { notFound } from 'next/navigation';
import { getPublicBlogPosts } from '@/lib/cms/public';
import { BlogArticle } from '@/components/BlogArticle';
import { pageMetadata } from '@/lib/metadata';
export const revalidate = 3600;
export async function generateStaticParams() { return (await getPublicBlogPosts()).map(post=>({slug:post.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params,post=(await getPublicBlogPosts()).find(p=>p.slug===slug);
  if(!post)notFound();
  const description=post.excerpt||post.body.replace(/^## /gm,'').slice(0,180);
  const metadata=pageMetadata(`/blog/${post.slug}`,post.title,description,post.cover?.image.src);
  return {...metadata,openGraph:{...metadata.openGraph,type:'article',publishedTime:new Date(post.publishedAt).toISOString()}};
}
export default async function BlogDetail({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params,post=(await getPublicBlogPosts()).find(p=>p.slug===slug);
  if(!post)notFound();
  return <main id="main"><BlogArticle post={post}/></main>;
}
