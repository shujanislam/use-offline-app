"use client";

import type { ReactNode } from "react";
import type { CachedQuery } from "@/lib/offline/use-cached-query";
import { Freshness } from "./freshness";

/**
 * Renders a cached query's data with its freshness, or the right empty
 * state: loading, not-available-offline, or a server error.
 */
export function CachedContent<T>({
  query,
  children,
}: {
  query: CachedQuery<T>;
  children: (data: NonNullable<T>) => ReactNode;
}) {
  const { data, status } = query;

  if (status === "loading") {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }
  if (status === "unavailable") {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center" data-testid="unavailable-offline">
        <p className="font-medium">This content isn&apos;t available offline yet.</p>
        <p className="mt-1 text-sm text-neutral-500">It will load once you&apos;re back online.</p>
      </div>
    );
  }
  if (status === "error" || data == null) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-900">
        {data === null ? (
          <p>Not found.</p>
        ) : (
          <>
            <p>Couldn&apos;t load this content.</p>
            <button className="mt-2 text-sm underline" onClick={() => void query.refresh()}>
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {query.cachedAt !== undefined && (
        <Freshness
          cachedAt={query.cachedAt}
          source={query.source}
          isRefreshing={query.isRefreshing}
          refreshFailed={query.refreshFailed}
        />
      )}
      {children(data as NonNullable<T>)}
    </div>
  );
}
