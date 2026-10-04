'use client';
export default function ErrorPage({reset}:{reset:()=>void}) { return <main id="main"><h1>Yazılar yüklenemedi.</h1><button onClick={reset}>Tekrar dene</button></main>; }
