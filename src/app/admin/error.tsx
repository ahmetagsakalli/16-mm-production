'use client';
export default function AdminError({ reset }: { reset: () => void }) { return <div className="admin-empty"><h1>Panel şu anda yüklenemedi.</h1><p>Kaydedilmiş içerikleriniz korunuyor.</p><button className="admin-primary" onClick={reset}>Tekrar dene</button></div>; }
