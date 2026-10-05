import "server-only";
import { getSessionUserId } from "./session";

// Private, per-user responses: never let a browser, CDN or Service Worker
// cache them. The client persists what it needs in IndexedDB instead.
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export function privateJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { ...PRIVATE_HEADERS, ...init?.headers } });
}

export async function withUser(handler: (userId: string) => unknown) {
  const userId = await getSessionUserId();
  if (!userId) return privateJson({ error: "unauthenticated" }, { status: 401 });
  return privateJson(await handler(userId));
}
