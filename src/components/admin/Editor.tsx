'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { MediaPicker } from './MediaPicker';
import { upload as uploadBlob } from '@vercel/blob/client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { belongsToCategory, canonicalCategory, categories, portfolioCategoryIds } from '@/content/site';
import type { ProjectDraft, ProjectRecord } from '@/lib/cms/types';
import { api, Icon, Message, thumbnail, useUnsaved } from './ui';
function projectChanges(draft: ProjectDraft) {
  const { title, categories, coverId, media, order, featured } = draft;
  return { title, categories, coverId, media, order, featured };
}
type Revision = { id: number; createdAt: number };
export function Editor({ initial }: { initial: ProjectRecord }) {
  const router = useRouter(); const [record, setRecord] = useState(initial), [draft, setDraft] = useState(initial.draft), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [progress, setProgress] = useState(''), [percent, setPercent] = useState(0), [history, setHistory] = useState<Revision[] | null>(null), [showHidden, setShowHidden] = useState(false);
  const [coverPicker, setCoverPicker] = useState(false);
  const files = useRef<HTMLInputElement>(null); const changed = JSON.stringify(draft) !== JSON.stringify(record.draft); useUnsaved(changed || busy);
  const accept = (p: ProjectRecord) => { setRecord(p); setDraft(p.draft); };
  const edit = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => { setDraft(d => ({ ...d, [key]: value })); setMessage(''); };
  async function action(task: () => Promise<void>) { if (busy) return; setBusy(true); setError(''); setMessage(''); try { await task(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); setProgress(''); } }
  async function save(publish = false) { await action(async () => { const p = await api<ProjectRecord>(`projects/${record.id}${publish ? '/publish' : ''}`, publish ? 'POST' : 'PUT', { version: record.version, draft: projectChanges(draft) }); accept(p); setMessage(publish ? 'Proje yayınlandı. Sitede güncel hali görünüyor.' : 'Taslak kaydedildi.'); router.refresh(); }); }
  async function uploadFiles(selected: FileList | null) {
    if (!selected?.length) return;
    const batch = Array.from(selected); if (files.current) files.current.value = '';
    await action(async () => {
      let current = record;
      if (changed) { current = await api<ProjectRecord>(`projects/${record.id}`, 'PUT', { version: record.version, draft: projectChanges(draft) }); accept(current); }
      const failures: string[] = [];
      for (const [index, file] of batch.entries()) {
        setProgress(`${index + 1} / ${batch.length} — ${file.name}`); setPercent(0);
        try {
          const plan = await api<{ cloud: boolean; id?: string; pathname?: string }>(`projects/${record.id}/upload-plan`, 'POST', { name: file.name, bytes: file.size });
          if (plan.cloud && plan.id && plan.pathname) {
            await uploadBlob(plan.pathname, file, { access: 'private', handleUploadUrl: '/api/admin/blob-token', clientPayload: JSON.stringify({ id: plan.id }), multipart: file.size > 4 * 1024 ** 2, contentType: file.type || 'application/octet-stream', onUploadProgress: event => setPercent(Math.round(event.percentage)) });
            setPercent(100);
            current = await api<ProjectRecord>(`projects/${record.id}/upload-complete`, 'POST', { id: plan.id });
          } else {
            current = await new Promise<ProjectRecord>((resolve, reject) => {
            const xhr = new XMLHttpRequest(); xhr.open('POST', `/api/admin/projects/${record.id}/upload`); xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name)); xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.upload.onprogress = event => { if (event.lengthComputable) setPercent(Math.round(event.loaded / event.total * 100)); };
            xhr.onload = () => { try { const data = JSON.parse(xhr.responseText); if (xhr.status >= 200 && xhr.status < 300) resolve(data); else reject(new Error(data.error || 'Yüklenemedi.')); } catch { reject(new Error('Sunucu yanıtı okunamadı.')); } }; xhr.onerror = () => reject(new Error('Bağlantı kesildi.')); xhr.send(file);
          });
          }
          accept(current);
        } catch (e) { failures.push(`${file.name}: ${(e as Error).message}`); }
      }
      if (failures.length) setError(failures.join('\n'));
      setMessage(`${batch.length - failures.length} dosya taslağa eklendi. Yayınlamak için “Yayınla” düğmesini kullanın.`); router.refresh();
    });
  }
  function move(id: string, direction: number) {
    const list = [...draft.media], i = list.findIndex(m => m.id === id), j = i + direction; if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]]; edit('media', list);
  }
  const entries = draft.media.filter(m => showHidden || m.visible);
  return <><Link href="/admin/projeler" className="admin-back">← Projeler</Link><div className="admin-page-title"><div><h1>{record.draft.title}</h1><p>{record.deleted ? 'Bu proje çöp kutusunda.' : !record.published ? 'Bu proje henüz yayınlanmadı.' : JSON.stringify(record.draft) !== JSON.stringify(record.published) ? 'Kaydedilen değişiklikler henüz yayınlanmadı.' : 'Bu proje sitede görünüyor.'}</p></div></div>
    <div className="admin-editor-actions"><span>{busy ? progress ? 'Dosya işleniyor…' : 'Kaydediliyor…' : changed ? 'Kaydedilmemiş değişiklikler' : 'Tüm değişiklikler kaydedildi'}</span><div>{!record.deleted && <><a className="admin-secondary" target="_blank" rel="noopener noreferrer" href={`/admin/onizleme/${record.id}`}>Önizle ↗</a><button className="admin-secondary" disabled={busy || !changed} onClick={() => save()}>Taslağı kaydet</button><button className="admin-primary" disabled={busy} onClick={() => save(true)}>Yayınla <Icon name="arrow" /></button></>}</div></div>
    <Message error={error} message={message} />
    {record.deleted ? <section className="admin-box admin-empty"><h2>Bu proje çöp kutusunda.</h2><p>Dosyalar ve sürüm geçmişi korunuyor. Geri aldığınızda taslak olarak açılır.</p><button className="admin-primary" disabled={busy} onClick={() => action(async () => { accept(await api<ProjectRecord>(`projects/${record.id}/restore`, 'POST', { version: record.version })); router.refresh(); })}>Projeyi geri al</button></section> : <>
      <div className="admin-editor-grid"><section className="admin-box admin-fields"><div className="admin-box-heading"><h2>Proje bilgileri</h2></div><fieldset disabled={busy}><label>Proje adı<input value={draft.title} maxLength={150} onChange={e => edit('title', e.target.value)} /></label><p className="admin-editor-hint">Ana sayfa fotoğraflarını ve seçili projeleri <Link href="/admin/ana-sayfa">Ana sayfa bölümünden</Link> düzenleyebilirsiniz.</p></fieldset></section>
      <section className="admin-box admin-fields"><div className="admin-box-heading"><h2>Bölümler</h2></div><fieldset disabled={busy}><div className="admin-checks">{portfolioCategoryIds.map(id => <label key={id}><input type="checkbox" checked={belongsToCategory(draft, id)} onChange={e => edit('categories', e.target.checked ? [...draft.categories.filter(c => canonicalCategory(c) !== id), id] : draft.categories.filter(c => canonicalCategory(c) !== id))} />{categories[id].title.tr}</label>)}</div></fieldset></section></div>
      <section className="admin-box admin-project-cover-choice"><div>{record.media.find(m => m.id === draft.coverId) ? <img className="admin-cover-preview" src={thumbnail(record.media.find(m => m.id === draft.coverId)!.image.src)} alt="Seçili proje kapağı"/> : <Icon name="image"/>}</div><div><h2>Proje kapak görseli</h2><p>Proje kartında bu fotoğraf görünür. Seçtikten sonra “Yayınla” ile siteye aktarın.</p><button className="admin-secondary" disabled={busy || !draft.media.some(m=>m.visible)} onClick={()=>setCoverPicker(true)}>Kapak görselini seç</button></div></section>
      {coverPicker && <MediaPicker title="Proje kapağını seç" photos={draft.media.filter(m=>m.visible).flatMap(m=>{const photo=record.media.find(a=>a.id===m.id);return photo?[{id:photo.id,projectId:record.id,projectTitle:draft.title,name:m.alt||photo.name,image:photo.image}]:[];})} onChoose={ids=>edit('coverId',ids[0])} onClose={()=>setCoverPicker(false)}/>}
      <section id="gallery" className="admin-box admin-gallery"><div className="admin-box-heading"><div><h2>Proje galerisi</h2><p>{record.media.filter(m => m.kind === 'image').length} fotoğraf · {record.media.filter(m => m.kind === 'video').length} film</p></div><button className="admin-primary" disabled={busy} onClick={() => files.current?.click()}><Icon name="plus" />Dosya ekle</button><input ref={files} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif,.tif,.tiff,.heic,.heif,.mp4,.mov,.m4v,.webm" onChange={e => uploadFiles(e.target.files)} hidden aria-label="Proje dosyalarını seç" /></div>
      <div className="admin-upload-note"><span>Birden fazla fotoğraf veya video seçebilirsiniz.</span><span>Fotoğraf: en fazla 128 MB · Video: en fazla 2 GB</span></div>
      {progress && <div className="admin-progress" role="status"><div><span>{progress}</span><span>{percent === 100 ? 'Hazırlanıyor…' : `%${percent}`}</span></div><progress max={100} value={percent} /></div>}
      {draft.media.some(m => !m.visible) && <label className="admin-checkbox admin-hidden-toggle"><input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />Galeriden kaldırılanları göster ({draft.media.filter(m => !m.visible).length})</label>}
      <div className="admin-media-grid">{entries.map(entry => {
        const media = record.media.find(m => m.id === entry.id); if (!media) return null;
        const index = draft.media.findIndex(m => m.id === entry.id), cover = entry.id === draft.coverId;
        return <article className={`admin-media-card ${!entry.visible ? 'is-hidden' : ''}`} key={entry.id}><div className="admin-media-image"><img src={thumbnail(media.image.src)} alt={entry.alt} loading="lazy" /></div><div className="admin-media-info"><p title={media.name}>{media.kind === 'video' ? 'Video · ' : ''}{media.name}</p><div className="admin-media-controls"><button disabled={busy || cover || !entry.visible} onClick={() => edit('coverId', entry.id)}>{cover ? 'Kapak görseli' : 'Kapak yap'}</button><div><button disabled={busy || index === 0} onClick={() => move(entry.id, -1)} aria-label={`${media.name} öne al`}>←</button><button disabled={busy || index === draft.media.length - 1} onClick={() => move(entry.id, 1)} aria-label={`${media.name} sona al`}>→</button></div></div><button className="admin-remove" disabled={busy || (cover && entry.visible)} onClick={() => edit('media', draft.media.map(m => m.id === entry.id ? { ...m, visible: !m.visible } : m))}>{entry.visible ? 'Galeriden kaldır' : 'Galeriye geri ekle'}</button></div></article>;
      })}</div>{!entries.length && <button className="admin-upload-empty" disabled={busy} onClick={() => files.current?.click()}><Icon name="image" /><strong>İlk fotoğraf veya filmi ekleyin</strong><span>Birden fazla dosya seçebilirsiniz.</span></button>}
      </section>
      <section className="admin-box admin-history"><div className="admin-box-heading"><div><h2>Yayın geçmişi</h2><p>Önceki bir yayını taslağa geri getirebilirsiniz.</p></div><button className="admin-secondary" disabled={busy} onClick={() => action(async () => setHistory(await api<Revision[]>(`projects/${record.id}/history`)))}>Geçmişi göster</button></div>{history && <div className="admin-revisions">{history.length ? history.map(revision => <div key={revision.id}><span>{new Date(revision.createdAt).toLocaleString('tr-TR')}</span><button disabled={busy} onClick={() => { if (window.confirm('Bu sürüm mevcut taslağın yerine getirilsin mi? Yayındaki içerik değişmeyecek.')) action(async () => { accept(await api<ProjectRecord>(`projects/${record.id}/revision`, 'POST', { version: record.version, revision: revision.id })); setMessage('Sürüm taslağa geri getirildi.'); }); }}>Taslağa geri getir</button></div>) : <p>Henüz yayınlanmadı.</p>}</div>}</section>
      <div className="admin-editor-bottom"><span>Dosyalar proje klasörüyle birlikte korunur.</span><button className="admin-danger" disabled={busy} onClick={() => { if (window.confirm('Proje siteden kaldırılıp çöp kutusuna taşınsın mı? Dosyalar silinmez.')) action(async () => { accept(await api<ProjectRecord>(`projects/${record.id}/trash`, 'POST', { version: record.version })); router.refresh(); }); }}>Çöp kutusuna taşı</button></div>
    </>}
  </>;
}
