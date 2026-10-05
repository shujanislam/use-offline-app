import Dexie, { type Table } from "dexie";

/**
 * Bump when the shape of cached `data` changes. Records written with another
 * version are ignored on read and purged on open, so an app update never
 * renders data it can't understand.
 */
export const CACHE_VERSION = 1;

export interface CachedRecord<T = unknown> {
  key: string;
  /** Owner of the record. Reads only return records for the current user. */
  userId: string;
  data: T;
  cachedAt: number;
  version: number;
}

export interface SessionMeta {
  key: "session";
  userId: string;
  name: string;
}

export type DomainTable = "feed" | "jobs" | "events" | "profile";

export const DOMAIN_TABLES: DomainTable[] = ["feed", "jobs", "events", "profile"];

class OfflineDatabase extends Dexie {
  feed!: Table<CachedRecord, string>;
  jobs!: Table<CachedRecord, string>;
  events!: Table<CachedRecord, string>;
  profile!: Table<CachedRecord, string>;
  meta!: Table<SessionMeta, string>;

  constructor() {
    super("app-offline");
    // Schema changes add a new `this.version(n)` with an `.upgrade()` that
    // migrates or clears affected tables.
    this.version(1).stores({
      feed: "&key, userId",
      jobs: "&key, userId",
      events: "&key, userId",
      profile: "&key, userId",
      meta: "&key",
    });
    this.on("ready", (db) => purgeOutdated(db as OfflineDatabase));
  }
}

async function purgeOutdated(db: OfflineDatabase) {
  await Promise.all(
    DOMAIN_TABLES.map((name) =>
      db.table<CachedRecord, string>(name).filter((r) => r.version !== CACHE_VERSION).delete(),
    ),
  );
}

let instance: OfflineDatabase | null = null;

/** Lazily opened so nothing touches IndexedDB during SSR. */
export function getDb(): OfflineDatabase {
  return (instance ??= new OfflineDatabase());
}

/** Remove every user-scoped record. Called on logout and on user switch. */
export async function clearUserData() {
  const db = getDb();
  await db.transaction("rw", [...DOMAIN_TABLES, "meta"], async () => {
    await Promise.all([...DOMAIN_TABLES, "meta" as const].map((name) => db.table(name).clear()));
  });
}
