// next.config.mjs — MERGED: the security hardening config (CSP + security
// headers) combined with the settings from the previous next.config.js
// (cloudinary remote pattern for dashboard uploads was preserved).

const isProd = process.env.NODE_ENV === 'production';

const csp = [
  "default-src 'self'",
  // Next.js needs inline scripts unless you adopt nonce-based CSP (see notes).
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // res.cloudinary.com kept from the old config so uploaded images render.
  // daktarinfo.com hosts the doctor profile images served by /api/public/doctors.
  "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://vromonguide.com https://blogger.googleusercontent.com https://encrypted-tbn0.gstatic.com https://*.gstatic.com https://daktarinfo.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  // frame-src: the landing-page coverage map (openstreetmap.org embed).
  'frame-src https://www.openstreetmap.org',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  isProd ? 'upgrade-insecure-requests' : '',
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // hide "X-Powered-By: Next.js"
  productionBrowserSourceMaps: false, // never ship source maps to the browser

  compiler: {
    // strip console.* from production bundles
    // (Next 14 rejects an empty `exclude` array, so use `true` = strip all)
    removeConsole: isProd ? true : false,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Preserved from the previous next.config.js — used by dashboard uploads.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'vromonguide.com' },
      { protocol: 'https', hostname: 'blogger.googleusercontent.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      // Doctor profile images served by GET /api/public/doctors.
      { protocol: 'https', hostname: 'daktarinfo.com' },
      { protocol: 'https', hostname: '**.daktarinfo.com' },
    ],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
