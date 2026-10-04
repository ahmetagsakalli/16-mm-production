'use client';

import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import type { ProjectPreview } from '@/content/projects';
import { categories, categoryIds, copy, type Category, type Locale } from '@/content/site';
import { Photo } from './Photo';
import { Arrow } from './Arrow';
import s from './SelectedProjects.module.css';

function ProjectAccordion({ projects, locale }: { projects: ProjectPreview[]; locale: Locale }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const current = projects[active];

  function select(index: number) {
    setActive(index);
    const container = track.current;
    const card = cards.current[index];
    if (container && card && window.matchMedia('(max-width: 700px)').matches) {
      container.scrollTo({
        left: card.offsetLeft,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }
  }

  function move(direction: number) {
    select((active + direction + projects.length) % projects.length);
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (projects.length < 2 || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = event.key === 'ArrowRight' ? (active + 1) % projects.length
      : event.key === 'ArrowLeft' ? (active - 1 + projects.length) % projects.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? projects.length - 1 : null;
    if (index === null) return;
    event.preventDefault();
    select(index);
    const card = cards.current[index];
    const target = window.matchMedia('(max-width: 700px)').matches ? card?.querySelector('a') : card?.querySelector('button');
    target?.focus({ preventScroll: true });
  }

  function syncScroll() {
    const container = track.current;
    if (!container || !window.matchMedia('(max-width: 700px)').matches) return;
    let nearest = 0;
    let distance = Infinity;
    cards.current.forEach((card, index) => {
      if (!card) return;
      const delta = Math.abs(card.offsetLeft - container.scrollLeft);
      if (delta < distance) { nearest = index; distance = delta; }
    });
    setActive(nearest);
  }

  if (!current) return <p id="selected-projects" className={s.empty}>Bu alanda henüz çalışma yok.</p>;

  return <>
    <div id="selected-projects" ref={track} className={s.accordion} role="group" aria-label="Seçilmiş projeler" onKeyDown={handleKeys} onScroll={syncScroll}>
      {projects.map((project, index) => <article
        key={project.slug}
        ref={element => { cards.current[index] = element; }}
        className={`${s.card} ${index === active ? s.active : ''}`}
        onPointerEnter={event => {
          if (event.pointerType === 'mouse' && window.matchMedia('(min-width: 701px)').matches && !track.current?.querySelector(':focus-visible')) setActive(index);
        }}
      >
        <Photo photo={project.cover} locale={locale} sizes={`(max-width: 700px) 85vw, ${index === active ? '(max-width: 1440px) 65vw, 980px' : '90px'}`} />
        <div className={s.shade} aria-hidden="true" />
        <button className={s.choose} aria-label={`${project.title[locale]} projesini görüntüle`} aria-pressed={index === active} onClick={() => select(index)} onFocus={() => setActive(index)}>
          <span className={s.verticalTitle} aria-hidden="true">{project.title[locale]}</span>
        </button>
        <Link className={s.details} href={`/projects/${project.slug}`} aria-label={`${project.title[locale]} — ${copy[locale].viewProject}`}>
          <h3>{project.title[locale]}</h3><span className={s.openArrow} aria-hidden="true"><Arrow diagonal /></span>
        </Link>
      </article>)}
    </div>
    {projects.length > 1 ? <div className={s.controls}>
      <button onClick={() => move(-1)} aria-label="Önceki çalışma" aria-controls="selected-projects"><Arrow /></button>
      <button onClick={() => move(1)} aria-label="Sonraki çalışma" aria-controls="selected-projects"><Arrow /></button>
    </div> : null}
    <p className="visually-hidden" role="status">{active + 1} / {projects.length}: {current.title[locale]}</p>
  </>;
}

export function SelectedProjects({ projects, locale }: { projects: ProjectPreview[]; locale: Locale }) {
  const [category, setCategory] = useState<Category>('architecture');
  const collection = projects.filter(project => project.categories.includes(category)).slice(0, 6);
  return <section id="selected" className={s.selected} aria-labelledby="selected-heading">
    <div className={s.heading}>
      <h2 id="selected-heading">Seçilmiş <span>çalışmalar</span></h2>
      <Link className={s.allProjects} href={`/portfolio/${category}`}>Tümünü gör<Arrow diagonal /></Link>
    </div>
    <div className={s.categoryList} role="group" aria-label="Çalışma alanı seçimi">
      {categoryIds.map(id => <button key={id} aria-pressed={category === id} aria-controls="selected-projects" onClick={() => setCategory(id)}>{categories[id].title[locale]}</button>)}
    </div>
    <ProjectAccordion key={category} projects={collection} locale={locale} />
  </section>;
}
