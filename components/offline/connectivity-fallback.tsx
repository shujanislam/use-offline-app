"use client";

import { useOffline } from "next/offline";

/** Suspense / loading.tsx fallback that explains why content is waiting. */
export function ConnectivityFallback({ what = "this page" }: { what?: string }) {
  const offline = useOffline();
  return (
    <p className="text-sm text-neutral-500" data-testid="connectivity-fallback">
      {offline ? `Waiting for a connection to load ${what}…` : "Loading…"}
    </p>
  );
}
