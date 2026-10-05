import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline" };

/** Served by the Service Worker for documents that were never saved. */
export default function OfflineFallbackPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">This page isn&apos;t available offline yet</h1>
      <p className="text-neutral-500">Reconnect to load it, or open something you&apos;ve already saved.</p>
      {/* Plain <a>: these are full loads, served from the Service Worker cache. */}
      <a href="/feed" className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Go to your feed
      </a>
    </main>
  );
}
