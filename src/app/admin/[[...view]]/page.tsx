import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { authenticated, hasPassword } from '@/lib/cms/auth';
import { getProjectRecord, getSettings, listProjects, toPublicProject } from '@/lib/cms/store';
import { Login } from '@/components/admin/Login';
import { Shell } from '@/components/admin/Shell';
import { Dashboard, Projects } from '@/components/admin/Projects';
import { Editor } from '@/components/admin/Editor';
import { Settings, Security } from '@/components/admin/Settings';
import { Gallery } from '@/components/Gallery';
import { VideoPlayer } from '@/components/VideoPlayer';
import s from '@/components/Site.module.css';
import { Homepage } from '@/components/admin/Homepage';
import { BlogList, BlogEditor } from '@/components/admin/Blog';
import { BlogArticle } from '@/components/BlogArticle';
import { getHomepage, mediaOptions, publishedProjectOptions, listBlogPosts, getBlogPost } from '@/lib/cms/editorial';
export default async function AdminPage({ params }: {
    params: Promise<{
        view?: string[];
    }>;
}) {
    const { view = [] } = await params;
    const signedIn = await authenticated();
    if (!signedIn) {
        if (view.length)
            redirect('/admin');
        return <Login setup={!await hasPassword() && process.env.NODE_ENV !== 'production'}/>;
    }
    if (!view.length)
        redirect('/admin/genel');
    const section = view[0];
    if (section === 'galeri') redirect('/admin/projeler');
    if (section === 'blog' && view.length === 2) {
        const post = await getBlogPost(view[1]).catch(() => null);
        if (!post) notFound();
        return <Shell active="blog"><BlogEditor key={post.id} initial={post} photos={await mediaOptions()}/></Shell>;
    }
    if (section === 'blog-onizleme' && view.length === 2) {
        const post = await getBlogPost(view[1]).catch(() => null);
        if (!post) notFound();
        const cover = (await mediaOptions()).find(photo => photo.id === post.draft.coverId);
        return <><div className="admin-preview-bar"><span>Taslak önizlemesi · Kaydedilmiş değişiklikler</span><Link href={`/admin/blog/${post.id}`}>Düzenlemeye dön →</Link></div><main className="admin-blog-preview"><BlogArticle post={{...post.draft,id:post.id,cover,publishedAt:post.publishedAt||post.updatedAt,updatedAt:post.updatedAt}}/></main></>;
    }
    if (section === 'ana-sayfa' && view.length === 1) {
        const [home, photos, projects] = await Promise.all([getHomepage(),mediaOptions(),publishedProjectOptions()]);
        return <Shell active="ana-sayfa"><Homepage initial={home} photos={photos} projects={projects}/></Shell>;
    }
    if (section === 'blog' && view.length === 1) return <Shell active="blog"><BlogList posts={await listBlogPosts()} photos={await mediaOptions()}/></Shell>;
    if (section === 'onizleme' && view.length === 2) {
        const record = await getProjectRecord(view[1]);
        const project = toPublicProject(record, true);
        return <><div className="admin-preview-bar"><span>Taslak önizlemesi · Kaydedilmiş değişiklikler</span><a href={`/admin/projeler/${record.id}`}>Düzenlemeye dön →</a></div>{project ? <main className="page-shell"><div className={s.projectIntro}><h1>{project.title.tr}</h1></div>{project.videos.map(video => <VideoPlayer key={video.src} src={video.src} poster={video.poster} locale="tr" title={video.title} description={project.description.tr}/>)}<Gallery photos={project.photos} locale="tr" title={project.title.tr} priorityFirst/></main> : <div className="admin-empty"><h1>Henüz görsel eklenmedi.</h1></div>}</>;
    }
    if (section === 'projeler' && view.length === 2) {
        let record;
        try {
            record = await getProjectRecord(view[1]);
        }
        catch {
            notFound();
        }
        return <Shell active="projeler"><Editor key={record.id} initial={record}/></Shell>;
    }
    if (view.length !== 1 || !['genel', 'projeler', 'ayarlar', 'guvenlik'].includes(section))
        notFound();
    return <Shell active={section}>{section === 'genel' ? <Dashboard projects={await listProjects()}/> : section === 'projeler' ? <Projects projects={await listProjects()}/> : section === 'ayarlar' ? <Settings initial={await getSettings()}/> : <Security />}</Shell>;
}
