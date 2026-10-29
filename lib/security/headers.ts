import { THUMBNAIL_HOSTS } from "../config/sources";

/**
 * Security headers applied to every response via next.config.ts.
 *
 * The CSP keeps `'unsafe-inline'` for scripts because Next.js emits inline
 * bootstrap scripts and this app uses one tiny inline script to apply saved
 * settings before first paint. Nothing on the site renders third-party HTML, so
 * the main XSS vector is closed at the rendering layer. guides/SECURITY.md describes
 * how to switch to a nonce-based CSP if you need a stricter policy.
 *
 * Google sign-in (My Profile) loads Google Identity Services from
 * accounts.google.com/gsi — the one third-party origin allowed, and only for
 * that script, its button frame and its stylesheet.
 */
const GOOGLE_GSI = "https://accounts.google.com/gsi/";
// Firebase (Google sign-in, community videos): SDK from gstatic, sign-in popup helpers, Firestore and Storage APIs.
const FIREBASE_SCRIPTS = "https://www.gstatic.com/firebasejs/ https://apis.google.com";
const FIREBASE_CONNECT = "https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://www.gstatic.com/firebasejs/";
export function buildContentSecurityPolicy(isDev: boolean): string {
  const imageHosts = THUMBNAIL_HOSTS.map((h) => `https://${h}`).join(" ");
  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": `'self' 'unsafe-inline' ${GOOGLE_GSI}client ${FIREBASE_SCRIPTS}${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src": `'self' 'unsafe-inline' ${GOOGLE_GSI}style`,
    "img-src": `'self' data: blob: ${imageHosts}`,
    "font-src": "'self'",
    "connect-src": `'self' ${GOOGLE_GSI} ${FIREBASE_CONNECT}${isDev ? " ws: wss:" : ""}`,
    "media-src": "'self' blob: https://firebasestorage.googleapis.com",
    "object-src": "'none'",
    "frame-src": `${GOOGLE_GSI} https://*.firebaseapp.com https://*.web.app`,
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "manifest-src": "'self'",
    "worker-src": "'self' blob:",
  };
  const policy = Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
  return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

export function securityHeaders(isDev: boolean): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isDev) },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
    // Google's sign-in popup must be able to report back to this window.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];
}
