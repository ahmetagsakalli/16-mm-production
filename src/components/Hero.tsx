'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ProjectPreview } from '@/content/projects';
import { copy, type Locale } from '@/content/site';
import { Photo } from './Photo';
import { Arrow } from './Arrow';
import s from './Site.module.css';

export function Hero({ projects, locale, lines }: { projects: ProjectPreview[]; locale: Locale; lines?: [string, string] }) {
  const [active, setActive] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const project = projects[active];
  const t = copy[locale];
  const move = (direction: number) => setActive(current => (current + direction + projects.length) % projects.length);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || projects.length < 2) return;

    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const updatePlayback = () => {
      clearInterval(timer);
      if (visible && !document.hidden) {
        timer = setInterval(() => {
          if (!hero.querySelector(':focus-visible')) {
            setActive(current => (current + 1) % projects.length);
          }
        }, 5000);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0.1 });
    observer.observe(hero);
    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      clearInterval(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [projects.length]);

  if (!project) return null;

  // object-fit: cover can scale a landscape image far beyond the visible width
  // on a tall phone. Include that cropped width and the small zoom in sizes.
  const ratio = project.cover.image.width / project.cover.image.height;
  const sizes = `(max-width: 600px) calc(max(100vw - 32px, clamp(460px, 82svh, 620px) * ${ratio}) * 1.045), (max-width: 900px) calc(max(100vw - 32px, clamp(500px, 100svh - 32px, 760px) * ${ratio}) * 1.045), calc(max(min(100vw - 32px, 1408px), clamp(540px, 100svh - 32px, 760px) * ${ratio}) * 1.045)`;

  return <section ref={heroRef} className={s.hero} aria-labelledby="home-heading">
    <div className={s.heroPhoto}><picture key={project.slug}>
      {project.cover.image.mobileSrc ? <source media="(max-width: 480px) and (orientation: portrait)" srcSet={project.cover.image.mobileSrc} /> : null}
      <Photo photo={project.cover} locale={locale} sizes={sizes} priority={active === 0} />
    </picture></div>
    <div className={s.heroShade} />
    <h1 id="home-heading" className={s.heroTitle}><span>{lines?.[0] || t.heroLine1}</span><span>{lines?.[1] || t.heroLine2}</span></h1>
    <div className={s.heroBottom}>
      <Link className={s.heroProject} href={`/projects/${project.slug}`} aria-label={`${project.title[locale]} — ${t.viewProject}`}><span>{project.title[locale]}</span><Arrow diagonal /></Link>
      <div className={s.slideControls}>
        <button onClick={() => move(-1)} aria-label="Önceki proje"><span aria-hidden="true">‹</span></button>
        <button onClick={() => move(1)} aria-label="Sonraki proje"><span aria-hidden="true">›</span></button>
      </div>
    </div>
  </section>;
}
