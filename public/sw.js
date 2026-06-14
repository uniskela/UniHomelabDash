const CACHE_NAME = "unihomelabdash-shell-v3";
const PUBLIC_SHELL_URLS = ["/login", "/setup", "/manifest.webmanifest"];

async function precachePublicShell(urls) {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          credentials: "omit",
          redirect: "manual",
        });

        if (
          response.type === "opaqueredirect" ||
          (response.status >= 300 && response.status < 400)
        ) {
          return;
        }

        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // Ignore failed precache entries.
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precachePublicShell(PUBLIC_SHELL_URLS));
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
