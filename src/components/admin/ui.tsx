'use client';
import { useEffect } from 'react';
export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, { method, headers: data === undefined ? undefined : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı.');
  return result;
}
export function thumbnail(src: string) { return src ? src.replace(/\.webp$/, '-640.webp') : ''; }
export function useUnsaved(changed: boolean) {
  useEffect(() => {
    if (!changed) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const click = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest('a');
      if (link && !link.target && !event.metaKey && !event.ctrlKey && !window.confirm('Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istiyor musunuz?')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload); document.addEventListener('click', click, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', click, true); };
  }, [changed]);
}
export function Icon({ name }: { name: 'grid' | 'folder' | 'image' | 'settings' | 'lock' | 'arrow' | 'logout' | 'plus' | 'menu' | 'write' }) {
  const paths = { write: 'M4 4h10 M4 4v16h16v-9 M10 15l1-4 8-8 3 3-8 8-4 1', grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', folder: 'M3 7V4h6l3 3h9v13H3z', image: 'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M15 7h.01', settings: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6', lock: 'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4', arrow: 'M6 18L18 6 M6 6h12v12', logout: 'M9 4H3v16h6 M12 8l4 4-4 4 M7 12h14', plus: 'M12 4v16 M4 12h16', menu: 'M4 6h16 M4 12h16 M4 18h16' };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export function Message({ error, message }: { error?: string; message?: string }) { return <>{error && <p className="admin-alert error" role="alert">{error}</p>}{message && <p className="admin-alert success" role="status">{message}</p>}</>; }
