# Offline-first Next.js demo

A Next.js 16 App Router app that keeps working when the network drops. It is built on
`experimental.useOffline`, IndexedDB (Dexie) and a Serwist Service Worker.

```bash
npm install
npm run build && npm start      # offline behavior needs a production build
npm run test:e2e                # build + Playwright offline/reconnect suite
```

Open http://localhost:3000, sign in as a demo user, browse, then toggle
DevTools → Network → **Offline**.

## Version notes (Next.js 16.3.8)

These were verified against the installed package, not canary docs:

- The hook is `import { useOffline } from "next/offline"`, **not** `next/navigation`.
- `experimental.useOffline: true` is the only config needed. Cache Components is
  not enabled; route-level `loading.tsx` gives the same offline shell behavior
  (see `node_modules/next/dist/docs/01-app/02-guides/offline-support.md`).
- Next enters the offline state on the browser `offline` event or when a
  navigation/prefetch/Server Action `fetch()` rejects. It detects recovery by
  polling `HEAD <current url>` with the `RSC` header. Pending navigations and
  Server Actions are then replayed once. Prefetches pause while offline.
- `useOffline()` returns `false` during SSR and hydration.

## Architecture

| Layer | Responsibility | Where |
| --- | --- | --- |
| `useOffline` | Connectivity state, held/replayed navigations and Server Actions | `next/offline`, `components/offline/*` |
| Router Cache + prefetch | Warm route shells in memory | `<Link>`, `components/offline/offline-warmup.tsx` |
| Repositories | Stale-while-revalidate over IndexedDB + API | `lib/repositories/*`, `lib/offline/use-cached-query.ts` |
| IndexedDB | Persistent per-user data | `lib/offline/db.ts` |
| Service Worker | Static assets and page shells across reloads | `app/sw.ts`, `app/serwist/[path]/route.ts` |

Components only call repository hooks (`useFeed()`, `useJobs()`, `useJob(id)`, …)
and never decide where data comes from. Each hook works like this:

1. Read IndexedDB and render the result right away.
2. If online, fetch `/api/*`, persist the response, and update the UI.
3. If the fetch fails, keep showing the saved copy, labeled "Saved for offline use".
4. When `useOffline()` flips back to `false`, refresh again.

Every screen shows how fresh its data is ("Updated 5 minutes ago" / "Saved for
offline use · updated yesterday"). Saved data is never presented as live.

### Security model

- **Page shells are user-independent.** Everything under `app/(app)` is
  statically prerendered and contains no private data. That makes shells safe
  to prefetch and to precache in the Service Worker.
- **Private data travels only through `/api/*`.** These responses are
  `Cache-Control: private, no-store`, and the Service Worker never handles
  them. The app stores what it needs in IndexedDB, keyed by user id.
- The session cookie is httpOnly and is never written to client storage.
  IndexedDB holds the user's id and name only, so that offline reads know whose
  data to show.
- On sign-out, or on sign-in as a different user, all saved data is wiped.
  Records written with a different `CACHE_VERSION` are ignored and purged.

### Service Worker policy (`app/sw.ts`)

| Request | Strategy |
| --- | --- |
| `/_next/static/*` | Precache / Cache First |
| `/`, `/login`, `/~offline`, `/feed`, `/jobs`, `/events`, `/profile` | Precached shells, versioned per build |
| Other page HTML | Network First, cached after visits |
| Images, fonts | Stale While Revalidate |
| Uncached document while offline | `/~offline` fallback |
| `/api/*`, RSC, `HEAD`, Server Actions | **Not handled.** They must fail visibly so `useOffline` can detect the outage and retry |

Serwist's `defaultCache` is deliberately not used. It caches `/api/*` (private
data) and answers RSC requests from cache. `reloadOnOnline` is off because
Next already retries pending work, and a reload would discard the user's state.

## Route classification

| Route | Shell offline | Saved data | Read offline | Mutation |
| --- | --- | --- | --- | --- |
| `/feed` | yes | yes | yes | Post: blocked offline |
| `/jobs` | yes | yes | yes | — |
| `/jobs/[id]` | yes, if prefetched (`<Link prefetch>` on the list) | from the jobs list | yes | Apply: blocked offline |
| `/events` | yes | yes | yes | — |
| `/profile` | yes | yes | yes | Sign out: blocked offline |
| `/status` | `loading.tsx` only | no (server-rendered per request) | waits for connection | — |

## Mutations

`useOnlineAction` (`lib/offline/use-online-action.ts`) wraps every write:

- **Offline when clicked:** nothing is sent. The user sees "You're offline. This
  action requires an internet connection." The draft is kept, and nothing is
  reported as a success.
- **Connection drops mid-request (Server Actions):** Next holds the action and
  replays it after reconnecting. The fetch rejected, so the request never
  reached the server. The button shows "Waiting for connection…".

There is no offline mutation queue yet; that is intentionally left for a later phase.

## Known limitations

- **After an offline hard reload, the Router Cache is empty.** The SW-served
  page and its saved data render, but client-side links to other routes stay
  pending until reconnecting, because prefetches don't run offline. A full load
  of a precached shell (e.g. typing `/jobs`) still works.
- **Routes not prefetched before going offline** (for example, job links that
  first appear on screen while offline) stay pending until the connection
  returns. The current page stays usable and shows the offline banner.
- **Detection without an `offline` event.** If the browser reports online but
  the server is unreachable, `useOffline` flips only when a framework request
  fails. Repository fetches still fail gracefully to saved data; they just
  can't flip the global flag.
- **Signing out requires a connection**, because only the server can clear the
  httpOnly cookie.
- The demo backend (`lib/server/store.ts`) is in-memory and resets when the
  server restarts.

## Tests (`e2e/offline.spec.ts`)

The suite runs against `next start` using Playwright's `context.setOffline`. It covers:

- first visit
- offline navigation to prefetched routes
- a route that was never prefetched (held pending, then completes)
- dynamic server routes (waiting fallback, then resume)
- no saved data
- outdated cache versions
- blocked offline post and sign-out
- refresh on reconnect
- offline hard reload through the SW, including the `/~offline` fallback
- user switching that leaks no data
- `no-store` API headers
