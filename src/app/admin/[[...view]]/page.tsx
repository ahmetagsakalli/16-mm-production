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
export default async function AdminPage({ params }: { params: Promise<{ view?: string[] }> }) {
  const { view = [] } = await params;
  const signedIn = await authenticated();
  if (!signedIn) { if (view.length) redirect('/admin'); return <Login setup={!hasPassword() && process.env.NODE_ENV !== 'production'} />; }
  if (!view.length) redirect('/admin/genel');
  const section = view[0];
  if (section === 'onizleme' && view.length === 2) {
    const record = getProjectRecord(view[1]); const project = toPublicProject(record, true);
    return <><div className="admin-preview-bar"><span>Taslak önizlemesi · Kaydedilmiş değişiklikler</span><a href={`/admin/projeler/${record.id}`}>Düzenlemeye dön →</a></div>{project ? <main className="page-shell"><div className={s.projectIntro}><h1>{project.title.tr}</h1></div>{project.videos.map(video => <VideoPlayer key={video.src} src={video.src} poster={video.poster} locale="tr" title={video.title} description={project.description.tr} />)}<Gallery photos={project.photos} locale="tr" title={project.title.tr} priorityFirst /></main> : <div className="admin-empty"><h1>Henüz görsel eklenmedi.</h1></div>}</>;
  }
  if (section === 'projeler' && view.length === 2) { let record; try { record = getProjectRecord(view[1]); } catch { notFound(); } return <Shell active="projeler"><Editor key={record.id} initial={record} /></Shell>; }
  if (view.length !== 1 || !['genel', 'projeler', 'galeri', 'ayarlar', 'guvenlik'].includes(section)) notFound();
  return <Shell active={section}>{section === 'genel' ? <Dashboard projects={listProjects()} /> : section === 'projeler' || section === 'galeri' ? <Projects projects={listProjects()} gallery={section === 'galeri'} /> : section === 'ayarlar' ? <Settings initial={getSettings()} /> : <Security />}</Shell>;
}
