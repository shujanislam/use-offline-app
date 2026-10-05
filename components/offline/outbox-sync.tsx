"use client";

import { useEffect } from "react";
import { useOffline } from "next/offline";
import { flushOutbox, usePendingPosts } from "@/lib/offline/outbox";
import { useSession } from "@/lib/session/session-context";

/**
 * Sends posts queued while offline: on app start, after every reconnect, and
 * whenever a post is queued or retried while we're online.
 */
export function OutboxSync() {
  const offline = useOffline();
  const { status, user } = useSession();
  const userId = status === "authenticated" ? user?.id : undefined;
  const queued = usePendingPosts(userId).filter((post) => post.status === "queued").length;

  useEffect(() => {
    if (!userId || offline || queued === 0) return;
    void flushOutbox(userId);
  }, [userId, offline, queued]);

  return null;
}
