import Image from 'next/image';
import s from './Portfolio.module.css';

type Reference = { name: string; src: string; width: number; height: number };

export function ReferenceMarquee({ references }: { references: Reference[] }) {
  const rows = [references.filter((_, index) => index % 2 === 0), references.filter((_, index) => index % 2 === 1)];

  return <section className={s.references} aria-labelledby="references-title">
    <div className={s.referencesHeading}>
      <h2 id="references-title">Birlikte çalıştığımız markalar</h2>
    </div>
    <div className={s.referenceRows}>
      {rows.map((row, index) => <div className={s.referenceWindow} key={index} tabIndex={0} role="group" aria-label={`Markalar, ${index + 1}. sıra`}>
        <div className={s.referenceTrack}>
          {[false, true].map(duplicate => <div className={s.referenceGroup} key={String(duplicate)} aria-hidden={duplicate || undefined}>
            {/* CSS moves these images into view without scrolling the page. */}
            {row.map(({ name, ...image }) => <div key={name} className={s.referenceLogo}><Image {...image} alt={duplicate ? '' : name} unoptimized loading="eager" fetchPriority="low" /></div>)}
          </div>)}
        </div>
      </div>)}
    </div>
  </section>;
}
