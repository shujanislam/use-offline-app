"use client";

import { useOffline } from "next/offline";
import { useNow } from "@/lib/use-now";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatAge(timestamp: number, now: number) {
  const seconds = Math.round((timestamp - now) / 1000);
  if (Math.abs(seconds) < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

/** Tells the user how old the data on screen is. Saved data is never presented as live. */
export function Freshness({
  cachedAt,
  source,
  isRefreshing,
  refreshFailed,
}: {
  cachedAt: number;
  source: "cache" | "network" | undefined;
  isRefreshing: boolean;
  refreshFailed: boolean;
}) {
  const offline = useOffline();
  const now = useNow();
  const age = formatAge(cachedAt, now);
  const fromSavedCopy = source === "cache";

  let label: string;
  if (isRefreshing && fromSavedCopy) label = `Saved ${age} · updating…`;
  else if (fromSavedCopy && (offline || refreshFailed)) label = `Saved for offline use · updated ${age}`;
  else label = `Updated ${age}`;

  return (
    <p className="text-xs text-neutral-500" data-testid="freshness" data-source={source}>
      {label}
    </p>
  );
}
