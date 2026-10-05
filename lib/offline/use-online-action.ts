"use client";

import { useState, useTransition } from "react";
import { useOffline } from "next/offline";
import type { ActionResult } from "@/lib/types";

export const OFFLINE_ACTION_MESSAGE = "You're offline. This action requires an internet connection.";

/**
 * Guards an action that must reach the server.
 *
 * - Offline when invoked: the action is not sent and a message is shown.
 *   Nothing is reported as successful.
 * - Connection lost while a Server Action is in flight: Next.js
 *   (`experimental.useOffline`) holds it and replays it once the
 *   connection returns. That's safe because the request never reached the
 *   server. `status` is then `waiting-for-connection`.
 */
export function useOnlineAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<ActionResult | void>,
  options: { onSuccess?: () => void } = {},
) {
  const offline = useOffline();
  const [pending, startTransition] = useTransition();
  const [blockedOffline, setBlockedOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(...args: Args) {
    setError(null);
    if (offline) {
      setBlockedOffline(true);
      return;
    }
    setBlockedOffline(false);
    startTransition(async () => {
      try {
        const result = await action(...args);
        if (result && !result.ok) setError(result.error);
        else options.onSuccess?.();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  const status = pending ? (offline ? "waiting-for-connection" : "pending") : "idle";
  // The offline notice disappears by itself once we're back online.
  const message = blockedOffline && offline ? OFFLINE_ACTION_MESSAGE : error;

  return { run, status, pending, offline, message } as const;
}
