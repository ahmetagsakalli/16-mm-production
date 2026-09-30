import type { NextConfig } from 'next';

const config: NextConfig = {
  devIndicators: false,
  // The public pages use small CSS modules; delivering them with the HTML avoids
  // render-blocking stylesheet round trips on a first visit over mobile networks.
  experimental: { globalNotFound: true, inlineCss: true },
  poweredByHeader: false,
  serverExternalPackages: ['@node-rs/argon2', 'sharp', '@ffmpeg-installer/ffmpeg'],
  outputFileTracingExcludes: { '*': ['./.transfer/**/*', './assets/gallery/originals/**/*', './.data/**/*', './reports/**/*', './public/media/gallery/**/*'] },
  async redirects() {
    return [
      { source: '/tr', destination: '/', permanent: true },
      { source: '/en', destination: '/', permanent: true },
      { source: '/tr/:path*', destination: '/:path*', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : [])] }, { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }, { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" }] }, ...['/media/gallery/:path*', '/media/hero/:path*'].map(source => ({ source, headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }))];
  },
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    formats: ['image/webp'],
    qualities: [75, 85],
    deviceSizes: [640, 768, 1280, 1920, 2560],
    imageSizes: [],
  },
};
export default config;
