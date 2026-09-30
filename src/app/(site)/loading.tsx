export default function Loading() {
  return <main id="main" aria-busy="true" style={{ minHeight: '100svh', padding: '32px 8px' }}>
    <p role="status" className="visually-hidden">Sayfa yükleniyor.</p>
    <div aria-hidden="true" style={{ height: '48px', width: 'min(60%, 360px)', background: '#f0f0ee', borderRadius: '8px', margin: '20px auto 36px' }} />
    <div aria-hidden="true" style={{ height: '52svh', background: '#f0f0ee', borderRadius: '14px' }} />
  </main>;
}
