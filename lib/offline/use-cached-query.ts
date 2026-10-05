"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { useOffline } from "next/offline";
import { useSession } from "@/lib/session/session-context";
import { NetworkUnavailableError, onInvalidate, type Resource } from "./resource";

export interface CachedQuery<T> {
  data: T | undefined;
  /** When `data` was fetched from the server. */
  cachedAt: number | undefined;
  /** `cache` = rendered from IndexedDB, `network` = confirmed by the server this session. */
  source: "cache" | "network" | undefined;
  /**
   * - `loading`: nothing to show yet
   * - `ready`: `data` is available (possibly stale, see `source`)
   * - `unavailable`: no saved copy and the network can't be reached
   * - `error`: no saved copy and the server returned an error
   */
  status: "loading" | "ready" | "unavailable" | "error";
  isRefreshing: boolean;
  /** The most recent refresh couldn't reach the server. */
  refreshFailed: boolean;
  refresh: () => Promise<void>;
}

type State<T> = Omit<CachedQuery<T>, "refresh">;

const INITIAL: State<never> = {
  data: undefined,
  cachedAt: undefined,
  source: undefined,
  status: "loading",
  isRefreshing: false,
  refreshFailed: false,
};

/**
 * Stale-while-revalidate over a persistent resource:
 * render the IndexedDB copy immediately, refresh from the network when
 * possible, and refresh again when Next.js reports connectivity is back.
 */
export function useCachedQuery<T>(resource: Resource<T>): CachedQuery<T> {
  const { user } = useSession();
  const userId = user?.id;
  const offline = useOffline();
  const [state, setState] = useState<State<T>>(INITIAL);
  // Ignore responses from superseded requests.
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const id = ++requestId.current;
    setState((s) => ({ ...s, isRefreshing: true }));
    try {
      const record = await resource.fetchFresh(userId);
      if (id !== requestId.current) return;
      setState({
        data: record.data,
        cachedAt: record.cachedAt,
        source: "network",
        status: "ready",
        isRefreshing: false,
        refreshFailed: false,
      });
    } catch (error) {
      if (id !== requestId.current) return;
      const networkDown = error instanceof NetworkUnavailableError;
      setState((s) => ({
        ...s,
        isRefreshing: false,
        refreshFailed: networkDown,
        status: s.data !== undefined ? "ready" : networkDown ? "unavailable" : "error",
      }));
    }
  }, [resource, userId]);

  // Read the saved copy first, then try the network unless we already know
  // we're offline.
  const offlineNow = useEffectEvent(() => offline);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void resource.readCache(userId).then((record) => {
      if (cancelled) return;
      const offline = offlineNow();
      if (record) {
        setState((s) =>
          s.source === "network" ? s : { ...s, data: record.data, cachedAt: record.cachedAt, source: "cache", status: "ready" },
        );
      } else if (offline) {
        setState((s) => ({ ...s, status: "unavailable" }));
      }
      if (!offline) void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [resource, userId, refresh]);

  // Reconnected: refresh what's on screen.
  const wasOffline = useRef(offline);
  useEffect(() => {
    if (wasOffline.current && !offline) void refresh();
    wasOffline.current = offline;
  }, [offline, refresh]);

  // A mutation elsewhere changed this data.
  useEffect(() => onInvalidate(resource.table, () => void refresh()), [resource.table, refresh]);

  return { ...state, refresh };
}
