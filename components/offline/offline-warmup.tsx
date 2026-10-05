"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOffline } from "next/offline";
import { useSession } from "@/lib/session/session-context";
import { IMPORTANT_ROUTES } from "@/lib/offline/routes";
import { warmOfflineData } from "@/lib/offline/warmup";

/**
 * After sign-in, while online and idle: prefetch the important routes into
 * the Router Cache and save their data to IndexedDB. Visible <Link>s are
 * prefetched by Next.js already; this covers the rest.
 */
export function OfflineWarmup() {
  const router = useRouter();
  const offline = useOffline();
  const { status, user } = useSession();
  const userId = status === "authenticated" ? user?.id : undefined;

  useEffect(() => {
    if (!userId || offline) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1000));
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => {
      for (const route of IMPORTANT_ROUTES) router.prefetch(route);
      void warmOfflineData(userId);
    });
    return () => cancelIdle(handle as number);
  }, [router, userId, offline]);

  return null;
}
