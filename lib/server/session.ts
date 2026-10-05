import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isKnownUser } from "./store";

// Stateless signed session cookie (demo auth). The cookie is httpOnly, so the
// client never sees the credential and nothing sensitive lands in IndexedDB.

const COOKIE = "session";
const SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret";

function sign(userId: string) {
  return createHmac("sha256", SECRET).update(userId).digest("base64url");
}

export async function getSessionUserId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [userId, signature] = value.split(".");
  if (!userId || !signature) return null;
  const expected = Buffer.from(sign(userId));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return isKnownUser(userId) ? userId : null;
}

export async function setSession(userId: string) {
  (await cookies()).set(COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
