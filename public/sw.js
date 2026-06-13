const CACHE_NAME = "unihomelabdash-shell-v2";
const PUBLIC_SHELL_URLS = ["/login", "/setup", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        if (request.mode === "navigate") {
          const loginUrl = new URL("/login", request.url).href;
          return Response.redirect(loginUrl, 302);
        }

        return undefined;
      })
    )
  );
});
