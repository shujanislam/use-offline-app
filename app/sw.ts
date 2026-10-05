/// <reference lib="webworker" />
import type { PrecacheEntry, RouteMatchCallbackOptions, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/*
 * Caching policy
 *
 *   /_next/static/*        Cache First (hashed, immutable; mostly precached)
 *   page shells (HTML)     Precached for important routes, Network First for
 *                          any other visited page, /~offline as last resort
 *   images / fonts         Stale While Revalidate
 *
 * Deliberately NOT handled, so they always hit the network:
 *   /api/*                 Private per-user data. Persisted in IndexedDB by
 *                          the app instead of a shared HTTP cache.
 *   RSC requests           Next.js `useOffline` detects offline from these
 *   HEAD requests          failing (and polls with HEAD to detect recovery).
 *   Server Actions (POST)  Answering them from a cache would hide outages
 *                          and break Next's built-in retry.
 */

function isPageRequest({ request, url, sameOrigin }: RouteMatchCallbackOptions) {
  if (!sameOrigin || request.method !== "GET") return false;
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return false;
  if (/^\/(api|_next|serwist)\//.test(url.pathname)) return false;
  // Real navigations, plus extension-less URLs that SerwistProvider asks us
  // to cache after client-side navigations.
  return request.mode === "navigate" || (request.destination === "" && !/\.\w+$/.test(url.pathname));
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "next-static",
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: isPageRequest,
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin && (request.destination === "image" || request.destination === "font"),
      handler: new StaleWhileRevalidate({
        cacheName: "static-media",
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
