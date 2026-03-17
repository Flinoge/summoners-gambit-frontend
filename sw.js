const IMAGE_CACHE_VERSION = "v1";
const IMAGE_CACHE_NAME = `sg-images-${IMAGE_CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("sg-images-") && name !== IMAGE_CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (request.destination !== "image") {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.status === 200) {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        if (cached) {
          return cached;
        }
        throw error;
      }
    })(),
  );
});
