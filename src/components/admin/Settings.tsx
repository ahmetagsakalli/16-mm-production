'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Settings as SettingsData } from '@/lib/cms/types';
import { api, Icon, Message, useUnsaved } from './ui';
export function Settings({ initial }: { initial: { data: SettingsData; version: number } }) {
  const [saved, setSaved] = useState(initial), [data, setData] = useState(initial.data), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  useUnsaved(JSON.stringify(saved.data) !== JSON.stringify(data));
  function update(key: keyof SettingsData, value: string) { setData(current => ({ ...current, [key]: value })); setMessage(''); }
  return <><div className="admin-page-title"><div><h1>Site ayarları</h1><p>İletişim bilgilerinizi ve hakkınızda yazısını düzenleyin.</p></div></div>
    <form onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { const result = await api<typeof initial>('settings', 'PUT', { version: saved.version, data: { email: data.email, phone: data.phone, instagram: data.instagram, heroLine1: data.heroLine1, heroLine2: data.heroLine2, address: data.address || '', about: data.about || '' } }); setSaved(result); setData(result.data); setMessage('Ayarlar kaydedildi ve sitede güncellendi.'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
      <Message error={error} message={message} /><fieldset disabled={busy}><div className="admin-editor-grid">
        <section className="admin-box admin-fields"><div className="admin-box-heading"><h2>İletişim</h2><Icon name="settings" /></div>
          <label>E-posta<input type="email" value={data.email} maxLength={254} onChange={e => update('email', e.target.value)} /></label>
          <label>Telefon<input type="tel" value={data.phone} maxLength={40} onChange={e => update('phone', e.target.value)} /></label>
          <label>Instagram<input value={data.instagram} maxLength={300} onChange={e => update('instagram', e.target.value)} /></label>
          <label>Adres<textarea value={data.address || ''} maxLength={500} rows={3} onChange={e => update('address', e.target.value)} /></label>
        </section>
        <section className="admin-box admin-fields"><div className="admin-box-heading"><h2>Hakkınızda</h2></div><label>İletişim sayfasındaki yazı<textarea value={data.about || ''} maxLength={4000} rows={10} onChange={e => update('about', e.target.value)} /><small>Boş bırakırsanız sitede gösterilmez.</small></label></section>
      </div></fieldset><button className="admin-primary" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Ayarları kaydet'}</button>
    </form><section className="admin-box admin-export"><div><h2>İçerik yedeği</h2><p>Proje bilgilerinizi ve önceki kayıtları indirin. Fotoğraf ve videolar ayrıca saklanır.</p></div><a className="admin-secondary" href="/api/admin/export" download>İçerik yedeğini indir ↓</a></section></>;
}
export function Security() {
  const router = useRouter(); const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <><div className="admin-page-title"><div><h1>Şifre değiştir</h1><p>Panel şifrenizi güncelleyin.</p></div></div><form className="admin-box admin-fields admin-security" onSubmit={async event => { event.preventDefault(); const form = new FormData(event.currentTarget); if (form.get('password') !== form.get('confirm')) { setError('Yeni şifreler eşleşmiyor.'); return; } setBusy(true); setError(''); try { await api('password', 'POST', { current: form.get('current'), password: form.get('password') }); router.replace('/admin'); router.refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}><p>Yeni şifrenizi kaydettikten sonra tekrar giriş yapmanız gerekir.</p><fieldset disabled={busy}><label>Mevcut şifre<input name="current" type="password" required maxLength={128} autoComplete="current-password" /></label><label>Yeni şifre<input name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" /><small>En az 12 karakter.</small></label><label>Yeni şifre tekrar<input name="confirm" type="password" minLength={12} maxLength={128} required autoComplete="new-password" /></label></fieldset><Message error={error} /><button className="admin-primary" disabled={busy}>{busy ? 'Güncelleniyor…' : 'Şifreyi güncelle'}</button></form></>;
}
