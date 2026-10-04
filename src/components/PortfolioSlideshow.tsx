'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Photo as PhotoData } from '@/lib/images';
import { Photo } from './Photo';
import s from './Portfolio.module.css';

export function PortfolioSlideshow({ photos, title, autoplay = false, showThumbnails = false }: { photos: PhotoData[]; title: string; autoplay?: boolean; showThumbnails?: boolean }) {
  const [active, setActive] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const thumbnailRail = useRef<HTMLDivElement>(null);
  const thumbnailButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const change = useCallback((step: number) => setActive(index => (index + step + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (!autoplay || interacting || photos.length < 2) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (container.current) observer.observe(container.current);
    const timer = window.setInterval(() => { if (visible && !document.hidden && !reduce.matches) change(1); }, 6000);
    return () => { clearInterval(timer); observer.disconnect(); };
  }, [autoplay, interacting, photos.length, change]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, [expanded]);

  useEffect(() => {
    const rail = thumbnailRail.current;
    const selected = thumbnailButtons.current[active];
    if (!showThumbnails || !rail || !selected) return;
    // Move only the filmstrip; keep the page and main photograph in place.
    rail.scrollTo({
      left: selected.offsetLeft - (rail.clientWidth - selected.offsetWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, [active, showThumbnails]);

  if (!photos.length) return null;
  const photo = photos[active];
  const close = () => { setExpanded(false); expandButton.current?.focus(); };
  const next = (active + 1) % photos.length;
  const arrows = <>
    <button className={`${s.slideArrow} ${s.slidePrevious}`} onClick={() => change(-1)} aria-label="Önceki fotoğraf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg></button>
    <button className={`${s.slideArrow} ${s.slideNext}`} onClick={() => change(1)} aria-label="Sonraki fotoğraf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8" /></svg></button>
  </>;
  return <div ref={container} className={`${s.slideshow} ${autoplay ? s.homeSlideshow : ''} ${showThumbnails ? s.gallerySlideshow : ''}`} role="region" aria-roledescription="slayt gösterisi" aria-label={title}
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocus={() => setInteracting(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}
    onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); change(1); } }}>
    <div className={s.stage} tabIndex={0} style={{ '--photo-ratio': `${photo.image.width} / ${photo.image.height}` } as CSSProperties}
      onPointerDown={event => { touch.current = { x: event.clientX, y: event.clientY }; }}
      onPointerUp={event => { const start = touch.current; touch.current = null; if (start && Math.abs(event.clientX - start.x) > 55 && Math.abs(event.clientY - start.y) < 70) change(event.clientX < start.x ? 1 : -1); }} onPointerCancel={() => { touch.current = null; }}>
      {photos.map((item, index) => (index === active || (ready && index === next)) && <div className={`${s.slide} ${index === active ? s.slideActive : ''}`} key={item.key} aria-hidden={index !== active} onLoad={() => setReady(true)}>
        <Photo photo={item} locale="tr" sizes="(max-width: 900px) 100vw, calc(100vw - 370px)" contain priority={index === 0} />
      </div>)}
      {photos.length > 1 && arrows}
      {!autoplay && <button ref={expandButton} className={s.expand} aria-label="Fotoğrafı tam ekran aç" onClick={() => setExpanded(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6" /></svg></button>}
    </div>
    <div className={`${s.slideMeta} ${autoplay ? s.slideMetaMinimal : ''}`}>
      {!autoplay && <span className={s.slideCounter} aria-live="polite">{String(active + 1).padStart(2, '0')} <span>/</span> {String(photos.length).padStart(2, '0')}</span>}
      <div className={s.slideDots}>{!showThumbnails && photos.length <= 20 && photos.map((item, index) => <button key={item.key} onClick={() => setActive(index)} aria-label={`${index + 1}. fotoğrafa git`} aria-current={active === index ? 'true' : undefined}><span /></button>)}</div>
    </div>
    {showThumbnails && photos.length > 1 && <div ref={thumbnailRail} className={s.thumbnailRail} role="group" aria-label="Proje fotoğrafları"
      onKeyDown={event => {
        let index: number;
        if (event.key === 'ArrowLeft') index = (active - 1 + photos.length) % photos.length;
        else if (event.key === 'ArrowRight') index = (active + 1) % photos.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = photos.length - 1;
        else return;
        event.preventDefault();
        event.stopPropagation();
        setActive(index);
        thumbnailButtons.current[index]?.focus({ preventScroll: true });
      }}>
      {photos.map((item, index) => <button key={item.key} ref={element => { thumbnailButtons.current[index] = element; }} className={s.thumbnail}
        onClick={() => setActive(index)} aria-label={`${index + 1}. fotoğrafı göster`} aria-current={active === index ? 'true' : undefined} tabIndex={active === index ? 0 : -1}>
        <Photo photo={item} locale="tr" sizes="(max-width: 560px) 76px, 100px" />
      </button>)}
    </div>}
    {expanded && <dialog ref={dialog} className={s.lightbox} onCancel={close} onClose={close}>
      <button className={s.lightboxClose} onClick={close} autoFocus aria-label="Tam ekranı kapat">×</button>
      <Photo photo={photo} locale="tr" sizes="100vw" contain priority />
      {photos.length > 1 && arrows}
      <p>{active + 1} / {photos.length}</p>
    </dialog>}
  </div>;
}
