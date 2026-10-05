"use client";

import { createContext, use, useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { useOffline } from "next/offline";
import { clearUserData, getDb } from "@/lib/offline/db";
import type { User } from "@/lib/types";

type SessionUser = Pick<User, "id" | "name">;

/**
 * - `loading`: reading the locally remembered session
 * - `authenticated`: confirmed by the server, or remembered locally while offline
 * - `unauthenticated`: the server says there is no session
 * - `offline-unknown`: offline, and no session was ever remembered on this device
 */
export type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "offline-unknown";

interface SessionValue {
  status: SessionStatus;
  user: SessionUser | null;
}

const SessionContext = createContext<SessionValue>({ status: "loading", user: null });

export function useSession() {
  return use(SessionContext);
}

/** Store the signed-in user's identity (not their credential) for offline use. */
export async function rememberUser(user: SessionUser) {
  const db = getDb();
  const previous = await db.meta.get("session");
  // Never let one account see another account's cached data.
  if (previous?.userId !== user.id) await clearUserData();
  await db.meta.put({ key: "session", userId: user.id, name: user.name });
}

/**
 * Resolves who the user is. Offline, it trusts the identity remembered on
 * this device so saved data stays readable; online, the server is the
 * source of truth and a missing session wipes local data.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const offline = useOffline();
  const [value, setValue] = useState<SessionValue>({ status: "loading", user: null });

  const verify = useCallback(async () => {
    let response: Response;
    try {
      response = await fetch("/api/session", { cache: "no-store" });
    } catch {
      return; // Unreachable: keep whatever we have locally.
    }
    if (response.status === 401) {
      await clearUserData();
      setValue({ status: "unauthenticated", user: null });
      return;
    }
    if (!response.ok) return;
    const user = (await response.json()) as SessionUser;
    await rememberUser(user);
    setValue({ status: "authenticated", user: { id: user.id, name: user.name } });
  }, []);

  const isOffline = useEffectEvent(() => offline);
  useEffect(() => {
    let cancelled = false;
    void getDb()
      .meta.get("session")
      .then(async (remembered) => {
        if (cancelled) return;
        if (remembered) {
          setValue({ status: "authenticated", user: { id: remembered.userId, name: remembered.name } });
        }
        if (!isOffline()) await verify();
        // Nothing remembered and the server couldn't be reached.
        setValue((v) => (v.status === "loading" ? { status: "offline-unknown", user: null } : v));
      });
    return () => {
      cancelled = true;
    };
  }, [verify]);

  // Re-check the session when connectivity returns: it may have expired.
  const wasOffline = useRef(offline);
  useEffect(() => {
    if (wasOffline.current && !offline) void verify();
    wasOffline.current = offline;
  }, [offline, verify]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
