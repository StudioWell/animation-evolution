/**
 * Static build for GitHub Pages (or any static host).
 *   npm run build:static   →  docs/index.html + docs/app.js
 *
 * The same pages, components and search engine as the Next.js app, bundled to run
 * entirely in the browser:
 *  - routing uses the URL hash (#/references?q=walk), so links, reloads and the back
 *    button work on a host that can only serve files;
 *  - /api/* requests are answered in the browser by the real search engine over the
 *    curated library;
 *  - live YouTube search and duration lookups are off: they need a server to keep the
 *    API key secret (see guides/DEPLOYMENT.md for the server version).
 * GitHub Pages can't send HTTP headers, so the Content-Security-Policy is a <meta> tag
 * that pins the one inline script by hash.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Options: --out <dir>  (default docs/)
//          --preview    build for a sandboxed preview frame (claude.ai artifact): thumbnails are
//                       served from <out>/thumbs/<videoId>.webp when present (or from the sprite
//                       sheets in <out>/thumbs/atlas.json, see scripts/pack-thumbs.py), the theme attribute is
//                       renamed so the host frame's own data-theme can't override it, no CSP meta.
const argv = process.argv.slice(2);
const argOut = argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : null;
const PREVIEW = argv.includes("--preview");
const OUT = argOut ? path.resolve(argOut) : path.join(ROOT, "docs");
// Frames the site serves itself (public/thumbs) ship next to the page.
const PUBLIC_THUMBS = path.join(ROOT, "public", "thumbs");
if (fs.existsSync(PUBLIC_THUMBS)) fs.cpSync(PUBLIC_THUMBS, path.join(OUT, "thumbs"), { recursive: true });
const ATLAS_FILE = path.join(OUT, "thumbs", "atlas.json");
const ATLAS = PREVIEW && fs.existsSync(ATLAS_FILE) ? JSON.parse(fs.readFileSync(ATLAS_FILE, "utf8")) : null;
const LOCAL_THUMBS = PREVIEW && !ATLAS && fs.existsSync(path.join(OUT, "thumbs"))
  ? fs.readdirSync(path.join(OUT, "thumbs")).filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5))
  : [];

// ---------- Browser stand-ins for Next.js modules ----------
const SHIMS = {
  "next/navigation": `
import { useSyncExternalStore } from "react";
const BASE = "https://site.invalid";
const listeners = new Set();
const TOKENS = { library: "/library", references: "/references", tutorials: "/tutorials", categories: "/categories", settings: "/settings", about: "/about", profile: "/profile", platforms: "/platforms", community: "/community" };
const parse = () => new URL(location.hash.startsWith("#/") ? location.hash.slice(1) : TOKENS[location.hash.slice(1)] ?? "/", BASE);
let current = parse();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
window.addEventListener("hashchange", () => {
  if (location.hash && !location.hash.startsWith("#/") && !TOKENS[location.hash.slice(1)]) return;
  current = parse();
  emit();
  window.scrollTo(0, 0);
});
const realReplace = history.replaceState.bind(history);
history.replaceState = (state, unused, url) => {
  if (typeof url === "string" && url.startsWith("/")) {
    current = new URL(url, BASE);
    realReplace(state, unused, "#" + url);
    return;
  }
  realReplace(state, unused, url);
};
export const virtualUrl = () => current;
export const onRouteChange = (l) => subscribe(l);
export function navigate(url, replace = false) {
  const target = new URL(url, current);
  const next = target.pathname + target.search;
  if (replace) { realReplace(history.state, "", "#" + next); current = target; emit(); return; }
  if (location.hash === "#" + next) { emit(); window.scrollTo(0, 0); return; }
  location.hash = next;
}
export function useRouter() {
  return { push: (u) => navigate(u), replace: (u) => navigate(u, true), back: () => history.back(), refresh: () => emit(), prefetch: () => {} };
}
export const usePathname = () => useSyncExternalStore(subscribe, () => current.pathname, () => "/");
export function useSearchParams() { return new URLSearchParams(useSyncExternalStore(subscribe, () => current.search, () => "")); }
export class NotFoundError extends Error {}
export function notFound() { throw new NotFoundError("NEXT_NOT_FOUND"); }
`,
  "next/link": `
import { navigate } from "next/navigation";
import { jsx } from "react/jsx-runtime";
export default function Link({ href, onClick, prefetch, ...rest }) {
  const internal = typeof href === "string" && href.startsWith("/");
  return jsx("a", {
    ...rest,
    href: internal ? "#" + href : href,
    onClick: (e) => {
      onClick?.(e);
      if (!internal || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === "_blank") return;
      e.preventDefault();
      navigate(href);
    },
  });
}
`,
  "next/image": `
import { jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
const LOCAL = new Set(__AE_LOCAL_THUMBS__);
// Preview only: thumbnails packed into sprite sheets (scripts/pack-thumbs.py) to keep the file count low.
const ATLAS = __AE_ATLAS__;
function thumbId(src) {
  if (typeof src !== "string") return null;
  if (src.startsWith("/thumbs/")) return src.slice(8, -5);
  const prefix = "https://i.ytimg.com/vi/";
  return src.startsWith(prefix) ? src.slice(prefix.length, prefix.length + 11) : null;
}
function localize(src) {
  const id = thumbId(src);
  // Frames this site serves itself live next to the page (relative, so sub-path hosting works).
  if (typeof src === "string" && src.startsWith("/thumbs/")) return src.slice(1);
  return id && LOCAL.has(id) ? "thumbs/" + id + ".webp" : src;
}
const sheets = {};
function loadSheet(url) {
  return (sheets[url] ??= new Promise((resolve, reject) => { const i = new window.Image(); i.onload = resolve; i.onerror = reject; i.src = url; }));
}
function Sprite({ tile, alt, fill, priority, style, className, onLoad, onError }) {
  const [sheet, col, row] = tile;
  const url = "thumbs/atlas-" + sheet + ".webp";
  const ref = useRef(null);
  const [near, setNear] = useState(Boolean(priority));
  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]);
  useEffect(() => {
    if (!near) return;
    let live = true;
    loadSheet(url).then(() => live && onLoad && onLoad({}), () => live && onError && onError({}));
    return () => { live = false; };
  }, [near, url]);
  const pos = (n, of) => (of > 1 ? (n / (of - 1)) * 100 : 0) + "%";
  return jsx("span", {
    ref, role: alt ? "img" : undefined, "aria-label": alt || undefined, className,
    style: {
      display: "block", width: "100%", height: "100%",
      ...(fill ? { position: "absolute", inset: 0 } : null),
      backgroundImage: near ? "url(" + url + ")" : undefined,
      backgroundSize: ATLAS.cols * 100 + "% " + ATLAS.rows * 100 + "%",
      backgroundPosition: pos(col, ATLAS.cols) + " " + pos(row, ATLAS.rows),
      ...style,
    },
  });
}
export default function Image({ src, alt, fill, sizes, priority, loading, style, ...rest }) {
  const id = thumbId(src);
  const tile = ATLAS && id ? ATLAS.items[id] : null;
  if (tile) return jsx(Sprite, { tile, alt, fill, priority, style, ...rest });
  return jsx("img", {
    src: localize(src), alt, decoding: "async", loading: priority ? "eager" : (loading ?? "lazy"), referrerPolicy: "strict-origin-when-cross-origin",
    style: fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style,
    ...rest,
  });
}
`,
  "next/font/google": `export function Archivo() { return { className: "", variable: "", style: { fontFamily: "Archivo" } }; }`,
  "server-only": `export {};`,
  "node:crypto": `
export function createHash() {
  let input = "";
  return { update(s) { input += s; return this; }, digest() {
    let a = 0x811c9dc5, b = 0x01000193;
    for (let i = 0; i < input.length; i++) { a = Math.imul(a ^ input.charCodeAt(i), 16777619); b = Math.imul(b + input.charCodeAt(i), 2246822507); }
    return ((a >>> 0).toString(16) + (b >>> 0).toString(16)).padStart(16, "0");
  } };
}
`,
};

// ---------- App entry ----------
const ENTRY = `
import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { onRouteChange, virtualUrl, NotFoundError } from "next/navigation";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import { CommunityProvider } from "@/components/community/CommunityProvider";
import { DecisionToast } from "@/components/community/DecisionToast";
import CommunityPage from "@/app/community/page";
import { WelcomeGate } from "@/components/welcome/WelcomeGate";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SkipLink } from "@/components/layout/SkipLink";
import HomePage from "@/app/page";
import LibraryIndexPage from "@/app/library/page";
import ReferencesPage from "@/app/references/page";
import TutorialsPage from "@/app/tutorials/page";
import ReferenceDetailPage from "@/app/references/[id]/page";
import TutorialDetailPage from "@/app/tutorials/[id]/page";
import CategoriesPage from "@/app/categories/page";
import SettingsPage from "@/app/settings/page";
import AboutPage from "@/app/about/page";
import ProfilePage from "@/app/profile/page";
import PlatformsPage from "@/app/platforms/page";
import PlatformPage from "@/app/platforms/[slug]/page";
import NotFound from "@/app/not-found";
import RouteError from "@/app/error";
import LibraryLoadingRoute from "@/app/library/loading";
import ReferencesLoading from "@/app/references/loading";
import TutorialsLoading from "@/app/tutorials/loading";
import { CURATED_LIBRARY } from "@/lib/data";
import { searchResources } from "@/lib/search/engine";
import { parseSearchQuery } from "@/lib/search/params";
import { parseItemIds, pickResources } from "@/lib/search/items";

const routes = [
  [/^\\/$/, () => HomePage()],
  [/^\\/library$/, (sp) => LibraryIndexPage({ searchParams: Promise.resolve(sp) }), LibraryLoadingRoute],
  [/^\\/references$/, (sp) => ReferencesPage({ searchParams: Promise.resolve(sp) }), ReferencesLoading],
  [/^\\/tutorials$/, (sp) => TutorialsPage({ searchParams: Promise.resolve(sp) }), TutorialsLoading],
  [/^\\/references\\/([^/]+)$/, (_sp, m) => ReferenceDetailPage({ params: Promise.resolve({ id: decodeURIComponent(m[1]) }) })],
  [/^\\/tutorials\\/([^/]+)$/, (_sp, m) => TutorialDetailPage({ params: Promise.resolve({ id: decodeURIComponent(m[1]) }) })],
  [/^\\/categories$/, () => CategoriesPage()],
  [/^\\/settings$/, () => <SettingsPage />],
  [/^\\/about$/, () => AboutPage()],
  [/^\\/profile$/, () => <ProfilePage />],
  [/^\\/platforms$/, () => PlatformsPage()],
  [/^\\/community$/, () => <CommunityPage />],
  [/^\\/platforms\\/([^/]+)$/, (_sp, m) => PlatformPage({ params: Promise.resolve({ slug: decodeURIComponent(m[1]) }) })],
];

// Server components are async functions; resolve nested ones before rendering.
async function resolve(el) {
  while (el && typeof el.type === "function" && el.type.constructor?.name === "AsyncFunction") el = await el.type(el.props);
  return el;
}

function App() {
  const [view, setView] = useState(null);
  const [path, setPath] = useState(() => virtualUrl().pathname + virtualUrl().search);
  const first = useRef(true);
  useEffect(() => onRouteChange(() => setPath(virtualUrl().pathname + virtualUrl().search)), []);
  useEffect(() => {
    let cancelled = false;
    const url = virtualUrl();
    const sp = Object.fromEntries(url.searchParams.entries());
    const route = routes.find(([re]) => re.test(url.pathname));
    (async () => {
      if (!route) return setView(<NotFound />);
      if (route[2]) { const Loading = route[2]; setView(<Loading />); }
      try {
        const el = await resolve(await route[1](sp, url.pathname.match(route[0])));
        if (!cancelled) setView(el);
      } catch (e) {
        if (cancelled) return;
        setView(e instanceof NotFoundError ? <NotFound /> : <RouteError error={e} reset={() => setPath((p) => p + " ")} />);
      }
    })();
    return () => { cancelled = true; };
  }, [path]);
  useEffect(() => {
    if (!view) return;
    const id = requestAnimationFrame(() => {
      const h1 = document.querySelector("main h1");
      const name = h1?.textContent?.trim();
      document.title = !name || name === "Animation Evolution" ? "Animation Evolution" : name + " | Animation Evolution";
      if (first.current) first.current = false;
      else document.getElementById("main")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [view]);
  return (
    <SettingsProvider>
      <ProfileProvider>
       <CommunityProvider>
        <SkipLink />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          <div key={path} className="ae-page">{view}</div>
        </main>
        <SiteFooter />
        <WelcomeGate />
        <DecisionToast />
       </CommunityProvider>
      </ProfileProvider>
    </SettingsProvider>
  );
}

// In-page anchors (#main, #references…) scroll instead of changing the route.
document.addEventListener("click", (e) => {
  const a = e.target instanceof Element ? e.target.closest("a[href^='#']") : null;
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#/")) return;
  e.preventDefault();
  const el = document.getElementById(href.slice(1));
  if (!el) return;
  const reduce = document.documentElement.dataset.motion === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
});

// No server: answer the app's /api requests in the browser.
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!raw.startsWith("/api/")) return realFetch(input, init);
  const url = new URL(raw, "https://site.invalid");
  if (url.pathname === "/api/live") return json({ enabled: false, items: [], nextPageToken: null, error: "not-configured" });
  if (url.pathname === "/api/library/items") {
    const ids = parseItemIds(url.searchParams.get("ids"));
    if (!ids.ok) return json({ error: { code: "invalid_query", message: ids.error } }, 400);
    return json({ items: pickResources(CURATED_LIBRARY, ids.ids) });
  }
  const kind =
    url.pathname === "/api/references/search" ? "reference" : url.pathname === "/api/tutorials/search" ? "tutorial" : url.pathname === "/api/library/search" ? "all" : null;
  if (!kind) return json({ error: { code: "not_found", message: "Unknown endpoint." } }, 404);
  const parsed = parseSearchQuery(kind, url.searchParams, { strict: true });
  if (!parsed.ok) return json({ error: { code: "invalid_query", message: parsed.error } }, 400);
  return json({ ...searchResources(CURATED_LIBRARY, parsed.query), live: { enabled: false } });
};

createRoot(document.getElementById("root")).render(<App />);
`;

const shimPlugin = {
  name: "static-shims",
  setup(build) {
    const names = Object.keys(SHIMS).map((n) => n.replace(/[/]/g, "\\/")).join("|");
    build.onResolve({ filter: new RegExp(`^(${names})$`) }, (args) => ({ path: args.path, namespace: "shim" }));
    build.onLoad({ filter: /.*/, namespace: "shim" }, (args) => ({ contents: SHIMS[args.path], loader: "jsx", resolveDir: ROOT }));
  },
};

// ---------- JS ----------
const result = await esbuild.build({
  stdin: { contents: ENTRY, loader: "tsx", resolveDir: ROOT, sourcefile: "static-entry.tsx" },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  minify: true,
  legalComments: "none",
  tsconfig: path.join(ROOT, "tsconfig.json"),
  plugins: [shimPlugin],
  loader: { ".css": "empty" },
  define: {
    "process.env.NODE_ENV": '"production"',
    // Google sign-in for My Profile: a public OAuth client id (not a secret), set when building.
    "process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID": JSON.stringify(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""),
    __AE_LOCAL_THUMBS__: JSON.stringify(LOCAL_THUMBS),
    __AE_ATLAS__: JSON.stringify(ATLAS),
  },
  banner: { js: "globalThis.process=globalThis.process||{env:{NODE_ENV:'production'}};" },
  logLevel: "warning",
});
let js = result.outputFiles[0].text;
// In a preview frame the host sets its own data-theme on <html>; use a private attribute instead.
const renameTheme = (text) => (PREVIEW ? text.replaceAll("dataset.theme", "dataset.aeTheme").replaceAll('"data-theme"', '"data-ae-theme"').replaceAll("[data-theme=", "[data-ae-theme=") : text);
js = renameTheme(js);

// ---------- CSS (Tailwind v4, candidates scanned from the source) ----------
const tailwind = await import("tailwindcss");
const compile = tailwind.compile ?? tailwind.default.compile;
const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(e.name)) files.push(p);
  }
};
for (const d of ["app", "components", "lib"]) walk(path.join(ROOT, d));
const candidates = new Set();
for (const f of files) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
    for (const token of m[2].split(/\s+/)) if (token) candidates.add(token);
  }
}
const twDir = path.dirname(fileURLToPath(import.meta.resolve("tailwindcss/package.json")));
const compiler = await compile(fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8"), {
  base: path.join(ROOT, "app"),
  loadStylesheet: async (id, base) => {
    const file = id === "tailwindcss" ? path.join(twDir, "index.css") : path.resolve(base, id);
    return { content: fs.readFileSync(file, "utf8"), base: path.dirname(file), path: file };
  },
  loadModule: async () => {
    throw new Error("Tailwind plugins are not used in this project");
  },
});
const css = renameTheme(compiler.build([...candidates]));

// ---------- HTML ----------
const settingsModule = await esbuild.build({
  entryPoints: [path.join(ROOT, "lib/settings/init-script.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  tsconfig: path.join(ROOT, "tsconfig.json"),
  logLevel: "warning",
});
const initScriptRaw = (await import(`data:text/javascript;base64,${Buffer.from(settingsModule.outputFiles[0].text).toString("base64")}`))
  .SETTINGS_INIT_SCRIPT;
const initScript = renameTheme(initScriptRaw);
const sha = (s) => createHash("sha256").update(s).digest("base64");

const csp = [
  "default-src 'self'",
  // Firebase's modular SDK loads from gstatic; Google sign-in (popup) uses apis.google.com.
  `script-src 'self' 'sha256-${sha(initScript)}' https://accounts.google.com/gsi/client https://www.gstatic.com/firebasejs/ https://apis.google.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "frame-src https://accounts.google.com/gsi/ https://*.firebaseapp.com https://*.web.app",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "media-src 'self' blob: https://firebasestorage.googleapis.com",
  "connect-src 'self' https://accounts.google.com/gsi/ https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://www.gstatic.com/firebasejs/",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const icon =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#141312"/><rect x="5" y="8" width="4" height="16" rx="2" fill="#cba77c" opacity=".3"/><rect x="11.5" y="8" width="4" height="16" rx="2" fill="#cba77c" opacity=".6"/><rect x="17" y="8" width="4" height="16" rx="2" fill="#cba77c"/><rect x="22.5" y="8" width="4" height="16" rx="2" fill="#f4f2ef"/></svg>',
  );

const themeAttr = PREVIEW ? "data-ae-theme" : "data-theme";
const head = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
const fullHtml = (inner) => PREVIEW ? inner : `<!doctype html>
<html lang="en" ${themeAttr}="dark" data-timestamps="on" data-motion="full">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${head}
${inner}
</body>
</html>
`;
const html = fullHtml(`
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>Animation Evolution</title>
<meta name="description" content="Find animation references, movement studies and video tutorials from trusted sources — searchable by movement, category and tool.">
<meta name="theme-color" content="#0b0908">
<link rel="icon" href="${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Golos+Text:wght@400..900&display=swap">
<script>${PREVIEW ? `(function(){var d=document.documentElement;d.setAttribute("data-ae-theme","dark");d.setAttribute("data-timestamps","on");d.setAttribute("data-motion","full");})();` : ""}${initScript}</script>
<style>:root{--font-archivo:"Archivo";--font-cyrillic:"Golos Text"}
${css}
/* Unlayered, so a host page's own reset (white body, black text, light colour scheme) can't win over the theme. */
:root{color-scheme:dark}:root[${themeAttr}="light"]{color-scheme:light}
html,body{background:var(--ae-bg);color:var(--ae-fg)}body{margin:0;font:inherit;font-family:var(--font-sans)}
${PREVIEW ? "body::before{content:'';position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:31;background:var(--ae-bg)}header.sticky{top:env(safe-area-inset-top,0px)}" : ""}</style>
${PREVIEW ? "" : "</head>\n<body>"}
<div id="root"></div>
<noscript><p style="padding:24px;font-family:system-ui;color:#f7f2eb;background:#0b0908">Animation Evolution needs JavaScript to search the library.</p></noscript>
<script src="app.js" charset="utf-8"></script>`);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "app.js"), js);
fs.writeFileSync(path.join(OUT, PREVIEW ? "animation-evolution.html" : "index.html"), html);
console.log(`${PREVIEW ? "preview" : "docs/index.html"} ${(html.length / 1024).toFixed(0)} KB, docs/app.js ${(js.length / 1024).toFixed(0)} KB`);
