'use client';

import { useEffect, useRef, useState } from 'react';
import s from './Site.module.css';

export function BackgroundVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let nearViewport = false;

    const updatePlayback = () => {
      if (nearViewport && !document.hidden) {
        if (!video.getAttribute('src')) video.src = src;
        video.muted = true;
        // If a browser blocks autoplay, the optimized cover remains visible.
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      nearViewport = entry.isIntersecting;
      updatePlayback();
    }, { rootMargin: '160px 0px' });
    observer.observe(video);
    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
      video.pause();
    };
  }, [src]);

  return <video ref={videoRef} className={`${s.motionVideo} ${ready ? s.motionVideoReady : ''}`} autoPlay muted loop playsInline preload="none" controls={false} disablePictureInPicture disableRemotePlayback aria-hidden="true" tabIndex={-1} onPlaying={() => setReady(true)} onError={() => setReady(false)} />;
}
