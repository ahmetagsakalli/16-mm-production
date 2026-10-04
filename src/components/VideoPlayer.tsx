'use client';

import { useId, useState } from 'react';
import type { Photo as PhotoData } from '@/lib/images';
import { copy, type Locale } from '@/content/site';
import { Photo } from './Photo';
import s from './Site.module.css';

export function VideoPlayer({ src, poster, locale, title, description }: { src: string; poster: PhotoData; locale: Locale; title: string; description: string }) {
  const descriptionId = useId();
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = copy[locale];
  return <div className={s.videoPlayer}>
    {!started ? <button className={s.videoPoster} onClick={() => setStarted(true)} aria-label={`${title} — ${t.play}`}><Photo photo={poster} locale={locale} sizes="(max-width: 1200px) 92vw, 1120px" priority /><span className={s.playButton} aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span></button> : failed ? <div className={s.videoError} role="alert"><p>{t.videoError}</p><button onClick={() => { setFailed(false); setStarted(false); }}>{t.retry}</button><a href={src}>{t.download} ↗</a></div> : <video src={src} poster={poster.image.src} controls playsInline autoPlay preload="metadata" aria-label={title} aria-describedby={descriptionId} onError={() => setFailed(true)} />}
    <p id={descriptionId} className="visually-hidden">{description}</p>
  </div>;
}
