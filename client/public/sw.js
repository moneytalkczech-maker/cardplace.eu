const CACHE = "cardbid-v2";
const STATIC_CACHE = "cardbid-static-v2";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/logo.svg",
  "/favicon.svg",
  "/manifest.json",
];

// Install – pre-cache kritických assetů
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate – cleanup starých cache
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

// Fetch – cache-first pro static, network-first pro API
self.addEventListener("fetch", (e) => {
  const { url, method } = e.request;

  // Jen GET požadavky
  if (method !== "GET") return;

  // API požadavky – network-first s offline fallbackem
  if (url.includes("/api/")) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const clone = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Statické assety (JS, CSS, obrázky) – cache-first
  if (url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
    return;
  }

  // Navigace (HTML stránky) – network-first s offline fallbackem
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match("/index.html").then((r) => r || caches.match("/"))
      )
    );
    return;
  }

  // Vše ostatní – network-first
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
