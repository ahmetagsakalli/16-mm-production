'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Message } from './ui';
export function Login({ setup }: { setup: boolean }) {
  const router = useRouter(); const [visible, setVisible] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <div className="admin-login">
    <div className="admin-login-art"><Link className="admin-wordmark" href="/">16mm<span>Production</span></Link><div><h1>Her projenin<br />kendi hikâyesi.</h1><p>Fotoğraflar, filmler ve yeni bakış açıları.</p></div><span>16mm Production © {new Date().getFullYear()}</span></div>
    <div className="admin-login-form"><form onSubmit={async event => { event.preventDefault(); const data = new FormData(event.currentTarget); if (setup && data.get('password') !== data.get('confirm')) { setError('Şifreler eşleşmiyor.'); return; } setBusy(true); setError(''); try { await api(setup ? 'setup' : 'login', 'POST', { password: data.get('password') }); router.replace('/admin/genel'); router.refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
      <h2>{setup ? 'Panelini hazırlayalım.' : 'Tekrar hoş geldiniz.'}</h2><p>{setup ? 'Yönetim paneli için bir şifre belirleyin. Bu kurulum yalnızca ilk girişte yapılır.' : 'Projelerinizi yönetmek için şifrenizle giriş yapın.'}</p>
      <label>Şifre<div className="admin-password"><input name="password" type={visible ? 'text' : 'password'} minLength={setup ? 12 : undefined} maxLength={128} required autoComplete={setup ? 'new-password' : 'current-password'} placeholder={setup ? 'En az 12 karakter' : 'Şifrenizi girin'} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}>{visible ? 'Gizle' : 'Göster'}</button></div></label>
      {setup && <label>Şifre tekrar<input name="confirm" type="password" minLength={12} maxLength={128} required autoComplete="new-password" /></label>}
      <Message error={error} /><button className="admin-primary admin-login-submit" disabled={busy}>{busy ? 'Lütfen bekleyin…' : setup ? 'Şifreyi belirle ve başla →' : 'Giriş yap →'}</button><Link href="/" className="admin-return">← Siteye dön</Link>
    </form><small>Web Tasarım, Uygulama ve Geliştirme<br /><a href="https://kocyigityazilim.com" target="_blank" rel="noopener noreferrer">kocyigityazilim.com</a></small></div>
  </div>;
}
