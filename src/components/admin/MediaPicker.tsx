'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import type { MediaOption } from '@/lib/cms/types';
import { thumbnail } from './ui';
export function MediaPicker({ title, photos, multiple = false, onChoose, onClose }: { title: string; photos: MediaOption[]; multiple?: boolean; onChoose: (ids: string[]) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState(''), [project, setProject] = useState(''), [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  const projects = [...new Map(photos.map(p => [p.projectId, p.projectTitle])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'tr'));
  const filtered = photos.filter(p => (!project || p.projectId === project) && `${p.name} ${p.projectTitle}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
  return <dialog ref={dialog} className="admin-picker" aria-labelledby="photo-picker-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="admin-picker-inner"><div className="admin-box-heading"><div><h2 id="photo-picker-title">{title}</h2><p>{multiple ? 'Birden fazla fotoğraf seçebilirsiniz.' : 'Kullanmak istediğiniz fotoğrafa tıklayın.'}</p></div><button className="admin-secondary" onClick={onClose} aria-label="Fotoğraf seçimini kapat">Kapat ×</button></div>
    <div className="admin-toolbar">{projects.length > 1 && <label>Proje<select value={project} onChange={e => setProject(e.target.value)}><option value="">Tüm projeler</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}<label className="admin-search">Fotoğraf ara<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Proje veya fotoğraf adı…" /></label></div>
    <div className="admin-picker-results" key={`${project}:${query}`}>
      <p className="admin-picker-count">{filtered.length} fotoğraf</p>
      <div className="admin-picker-grid">{filtered.map(photo => <button key={photo.id} type="button" aria-label={`${photo.name} seç`} aria-pressed={selected.includes(photo.id)} onClick={() => { if (!multiple) { onChoose([photo.id]); onClose(); } else setSelected(current => current.includes(photo.id) ? current.filter(id => id !== photo.id) : [...current, photo.id]); }}><img src={thumbnail(photo.image.src)} alt="" loading="lazy" /><span>{photo.projectTitle}</span><small>{photo.name}</small>{multiple && <b aria-hidden="true">{selected.includes(photo.id) ? '✓' : ''}</b>}</button>)}</div>
      {!filtered.length && <p className="admin-empty">Fotoğraf bulunamadı.</p>}
    </div>
    {multiple && <div className="admin-picker-footer"><span>{selected.length} fotoğraf seçildi</span><button className="admin-primary" disabled={!selected.length} onClick={() => { onChoose(selected); onClose(); }}>Seçilenleri ekle</button></div>}</div>
  </dialog>;
}
