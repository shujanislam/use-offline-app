"use client";

import { useEffect, useState } from "react";
import { useOffline } from "next/offline";

const RECONNECTED_NOTICE_MS = 3000;

/** Global connectivity banner, driven by Next.js `useOffline`. */
export function OfflineIndicator() {
  const offline = useOffline();
  const [previous, setPrevious] = useState(offline);
  const [justReconnected, setJustReconnected] = useState(false);

  // Detect the offline -> online transition during render.
  if (previous !== offline) {
    setPrevious(offline);
    setJustReconnected(!offline);
  }

  useEffect(() => {
    if (!justReconnected) return;
    const timer = setTimeout(() => setJustReconnected(false), RECONNECTED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [justReconnected]);

  const message = offline
    ? "You're offline. Showing saved content."
    : justReconnected
      ? "Back online. Updating…"
      : null;

  return (
    <div role="status" aria-live="polite" data-testid="connectivity-status" data-offline={offline}>
      {message && (
        <p
          className={`px-4 py-2 text-center text-sm font-medium ${
            offline ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
