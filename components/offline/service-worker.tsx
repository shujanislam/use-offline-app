"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

/**
 * Registers the Service Worker (built from app/sw.ts). It keeps static
 * assets and public page shells available across offline reloads.
 */
export function ServiceWorker({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      // Next.js `useOffline` already retries pending work on reconnect; a full
      // reload would throw away the user's in-progress state.
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  );
}
