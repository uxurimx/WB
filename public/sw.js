const CACHE_NAME = "wb-diesel-v1";
const OFFLINE_URL = "/offline";
const STATIC_ASSETS = [OFFLINE_URL];

// ── Install: pre-cache offline page ──────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, offline fallback ────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests and Chrome extension requests
  if (request.method !== "GET" || !request.url.startsWith("http")) return;

  const url = new URL(request.url);

  // Skip API calls and Next.js internals — never cache these
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/")
  ) {
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache the response for images and static assets
          return res;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets (images, fonts): cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((res) => {
              cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
  }
});
