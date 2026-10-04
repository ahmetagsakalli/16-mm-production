'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Photo as PhotoData } from '@/content/projects';
import { copy, type Locale } from '@/content/site';
import { Photo } from './Photo';
import { Arrow } from './Arrow';
import s from './Site.module.css';
import g from './Gallery.module.css';

export function Gallery({ photos, locale, title, priorityFirst = true }: { photos: PhotoData[]; locale: Locale; title: string; priorityFirst?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const isOpen = active !== null;
  const t = copy[locale];
  const rows: { photo: PhotoData; index: number }[][] = [];
  for (let index = 0; index < photos.length;) {
    const firstLandscape = index === 0 && photos[index].image.width / photos[index].image.height >= 1.2;
    const count = firstLandscape ? 1 : Math.min(2, photos.length - index);
    rows.push(photos.slice(index, index + count).map((photo, offset) => ({ photo, index: index + offset })));
    index += count;
  }
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);
  const move = (direction: number) => setActive(current => ((current ?? 0) + direction + photos.length) % photos.length);
  const close = () => dialog.current?.close();
  return <>
    <div className={g.gallery}>
      {rows.map(row => <div className={g.row} key={row[0].photo.key}>{row.map(({ photo, index }) => {
        const ratio = photo.image.width / photo.image.height;
        const share = ratio / row.reduce((total, item) => total + item.photo.image.width / item.photo.image.height, 0);
        return <button key={`${photo.key}-${index}`} className={g.photo} style={{ '--photo-ratio': ratio } as CSSProperties} aria-label={`${t.openPhoto}: ${photo.alt[locale]}`} onClick={() => { setActive(index); dialog.current?.showModal(); }}>
          <Photo photo={photo} locale={locale} sizes={`(max-width: 600px) calc(100vw - 48px), (max-width: 1440px) ${Math.ceil(share * 94)}vw, ${Math.ceil(share * 1344)}px`} priority={priorityFirst && index === 0} />
          <span className={g.expand} aria-hidden="true"><Arrow diagonal /></span>
        </button>;
      })}</div>)}
    </div>
    <dialog ref={dialog} className={s.lightbox} aria-label={`${title} — ${t.gallery}`} onClose={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }} onTouchStart={event => { touchX.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touchX.current !== null) { const diff = touchX.current - event.changedTouches[0].clientX; if (Math.abs(diff) > 50) move(diff > 0 ? 1 : -1); } touchX.current = null; }}>
      {active !== null ? <>
        <div className={s.lightboxTop}><span>{title}</span><span aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span><button autoFocus onClick={close} aria-label={t.close}><span aria-hidden="true">×</span></button></div>
        <div className={s.lightboxImage}><Photo key={photos[active].key} photo={photos[active]} locale={locale} sizes="100vw" contain /></div>
        <div className={s.lightboxBottom}><button onClick={() => move(-1)} aria-label={t.previousPhoto}>←</button><button onClick={() => move(1)} aria-label={t.nextPhoto}>→</button></div>
      </> : null}
    </dialog>
  </>;
}
