import type { Metadata } from "next";
import { connection } from "next/server";
import { listPosts } from "@/lib/server/store";

export const metadata: Metadata = { title: "Live status" };

/**
 * Server-rendered on every request: the one route here that can't be
 * served offline. Navigating to it offline shows loading.tsx (prefetched
 * shell) until Next.js reconnects and retries the request.
 */
export default async function StatusPage() {
  await connection();
  const renderedAt = new Date();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Live status</h1>
      <dl className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm" data-testid="live-status">
        <dt className="text-neutral-500">Rendered by server at</dt>
        <dd className="font-mono">{renderedAt.toISOString()}</dd>
        <dt className="text-neutral-500">Server uptime</dt>
        <dd className="font-mono">{Math.round(process.uptime())}s</dd>
        <dt className="text-neutral-500">Posts on server</dt>
        <dd className="font-mono">{listPosts().length}</dd>
      </dl>
      <p className="text-sm text-neutral-500">This page is never saved for offline use.</p>
    </div>
  );
}
