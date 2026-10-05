import { CACHE_VERSION, getDb, type CachedRecord, type DomainTable } from "./db";

/** The request never reached the server (offline, DNS failure, server down). */
export class NetworkUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Network unavailable", { cause });
    this.name = "NetworkUnavailableError";
  }
}

/** The server answered, but not with a success. */
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with status ${status}`);
    this.name = "HttpError";
  }
}

/**
 * A piece of server data with a persistent local copy. Components never use
 * this directly; they go through repository hooks built on `useCachedQuery`.
 */
export interface Resource<T> {
  /** Stable identity, used for invalidation and effect dependencies. */
  id: string;
  table: DomainTable;
  readCache(userId: string): Promise<CachedRecord<T> | undefined>;
  /** Fetch from the network and persist. Throws on failure; cache is untouched. */
  fetchFresh(userId: string): Promise<CachedRecord<T>>;
}

export function defineResource<T>(options: { table: DomainTable; key: string; url: string }): Resource<T> {
  const { table, key, url } = options;

  return {
    id: `${table}:${key}`,
    table,

    async readCache(userId) {
      const record = await getDb().table<CachedRecord<T>, string>(table).get(key);
      if (!record || record.userId !== userId || record.version !== CACHE_VERSION) return undefined;
      return record;
    },

    async fetchFresh(userId) {
      let response: Response;
      try {
        response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
      } catch (error) {
        throw new NetworkUnavailableError(error);
      }
      if (!response.ok) throw new HttpError(response.status);

      const record: CachedRecord<T> = {
        key,
        userId,
        data: (await response.json()) as T,
        cachedAt: Date.now(),
        version: CACHE_VERSION,
      };

      // Don't persist a response that arrived after the user signed out or
      // switched accounts mid-request.
      const db = getDb();
      await db.transaction("rw", [db.meta, db.table(table)], async () => {
        const session = await db.meta.get("session");
        if (session?.userId === userId) await db.table(table).put(record);
      });
      return record;
    },
  };
}

const invalidations = new EventTarget();

/** Ask every mounted query on `table` to refetch, e.g. after a mutation. */
export function invalidate(table: DomainTable) {
  invalidations.dispatchEvent(new CustomEvent(table));
}

export function onInvalidate(table: DomainTable, listener: () => void) {
  invalidations.addEventListener(table, listener);
  return () => invalidations.removeEventListener(table, listener);
}
