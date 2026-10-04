'use client';

import { useState } from 'react';
import s from './Portfolio.module.css';

export function ProjectInquiry({ number }: { number: string }) {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const message = `Merhaba, ben ${name.trim()}.\n\n${project.trim()}`;
  return <section id="projenizden-bahsedin" className={s.inquiry} aria-labelledby="inquiry-title">
    <div className={s.inquiryIntro}><h2 id="inquiry-title">Projenizden bahsedin.</h2><p>Bir mekân, bir ürün, bir fikir.<br />Birlikte planlayalım.</p></div>
    <form action={`https://wa.me/${number}`} method="get" target="_blank" rel="noopener noreferrer" className={s.inquiryForm}>
      <label htmlFor="inquiry-name">Adınız<input id="inquiry-name" autoComplete="name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} pattern=".*\S.*" /></label>
      <label htmlFor="inquiry-project">Nasıl bir çekim düşünüyorsunuz?<textarea id="inquiry-project" required maxLength={2000} rows={4} value={project} onChange={event => { setProject(event.target.value); event.target.setCustomValidity(event.target.value.trim() ? '' : 'Projenizden kısaca bahsedin.'); }} /></label>
      <input type="hidden" name="text" value={message} />
      <button type="submit">WhatsApp’ta devam et <span aria-hidden="true">↗</span></button>
    </form>
  </section>;
}
