const CACHE = "cardbid-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/index.html"])));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return;
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(e.request).then((r) => r || fetch(e.request).then((r) => { c.put(e.request, r.clone()); return r; }))
    )
  );
});
