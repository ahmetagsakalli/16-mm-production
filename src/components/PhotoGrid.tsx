'use client';

import { useEffect, useRef, useState } from 'react';
import type { Photo as PhotoData } from '@/lib/images';
import { Photo } from './Photo';
import s from './Portfolio.module.css';

function GalleryLightbox({ photos, start, title, onClose }: { photos: PhotoData[]; start: number; title: string; onClose: () => void }) {
  const [active, setActive] = useState(start);
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const change = (step: number) => setActive(index => (index + step + photos.length) % photos.length);

  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialog} className={`${s.lightbox} ${s.photoLightbox}`} aria-label={`${title} — fotoğraf galerisi`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        change(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
    <button className={s.lightboxClose} onClick={onClose} autoFocus aria-label="Fotoğrafı kapat">×</button>
    <div className={s.lightboxPhoto}
      onPointerDown={event => { touch.current = { x: event.clientX, y: event.clientY }; }}
      onPointerUp={event => {
        const start = touch.current;
        touch.current = null;
        if (start && Math.abs(event.clientX - start.x) > 55 && Math.abs(event.clientY - start.y) < 70) change(event.clientX < start.x ? 1 : -1);
      }} onPointerCancel={() => { touch.current = null; }}>
      <Photo photo={photos[active]} locale="tr" sizes="100vw" contain priority />
    </div>
    {photos.length > 1 && <>
      <button className={`${s.slideArrow} ${s.slidePrevious}`} onClick={() => change(-1)} aria-label="Önceki fotoğraf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg></button>
      <button className={`${s.slideArrow} ${s.slideNext}`} onClick={() => change(1)} aria-label="Sonraki fotoğraf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8" /></svg></button>
    </>}
    <p aria-live="polite" aria-atomic="true">{active + 1} / {photos.length}</p>
  </dialog>;
}

export function PhotoGrid({ photos, title }: { photos: PhotoData[]; title: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!photos.length) return null;
  return <>
    <div className={s.photoGrid} role="group" aria-label={`${title} fotoğrafları`}>
      {photos.map((photo, index) => <button key={photo.key} className={s.photoTile} aria-haspopup="dialog"
        aria-label={`${photo.alt.tr} — büyüt`} onClick={() => setSelected(index)}>
        <Photo photo={photo} locale="tr" sizes="(max-width: 560px) 32vw, (max-width: 900px) 31vw, (max-width: 1200px) calc((100vw - 320px) / 3), calc((100vw - 400px) / 3)" priority={index === 0} />
        <span className={s.photoTileExpand} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6" /></svg></span>
      </button>)}
    </div>
    {selected !== null && <GalleryLightbox photos={photos} start={selected} title={title} onClose={() => setSelected(null)} />}
  </>;
}
