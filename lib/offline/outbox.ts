"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { createPost } from "@/app/actions";
import { getDb, type OutboxPost } from "./db";
import { invalidate } from "./resource";

/**
 * Posts written offline are saved here and sent, oldest first, once the
 * connection is back (see `OutboxSync`). Every post carries a device-generated id, so a post sent
 * twice (lost response, two tabs, a reload mid-send) is stored once.
 */

export async function enqueuePost(userId: string, body: string): Promise<OutboxPost> {
  const post: OutboxPost = { id: crypto.randomUUID(), userId, body, createdAt: Date.now(), status: "queued" };
  await getDb().outbox.add(post);
  return post;
}

export async function retryPost(id: string) {
  await getDb().outbox.update(id, { status: "queued", error: undefined });
}

export async function discardPost(id: string) {
  await getDb().outbox.delete(id);
}

/** Send every queued post for `userId`, oldest first. */
export function flushOutbox(userId: string): Promise<void> {
  return withOutboxLock(async () => {
    const db = getDb();
    const queued = await db.outbox.where("userId").equals(userId).sortBy("createdAt");
    let sent = false;

    for (const { id } of queued) {
      // Re-read: another tab may have sent it, or the user discarded it.
      const post = await db.outbox.get(id);
      if (!post || post.status !== "queued") continue;

      let result;
      try {
        // With `experimental.useOffline`, a Server Action that can't reach the
        // server stays pending and is retried when the connection returns.
        result = await createPost(post.id, post.userId, post.body);
      } catch {
        // Not a network problem (those stay pending): e.g. the server crashed.
        result = { ok: false, error: "Something went wrong." } as const;
      }
      if (result.ok) {
        await db.outbox.delete(id);
        sent = true;
      } else {
        await db.outbox.update(id, { status: "failed", error: result.error });
      }
    }

    if (sent) invalidate("feed");
  });
}

let localFlush: Promise<void> = Promise.resolve();

/** One flush at a time across every tab of this app. */
async function withOutboxLock(task: () => Promise<void>): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request("app-outbox", task);
    return;
  }
  await (localFlush = localFlush.then(task, task));
}

/** The user's unsent posts, oldest first. Updates live, also across tabs. */
export function usePendingPosts(userId: string | undefined): OutboxPost[] {
  const [posts, setPosts] = useState<OutboxPost[]>([]);

  useEffect(() => {
    if (!userId) return;
    const subscription = liveQuery(() => getDb().outbox.where("userId").equals(userId).sortBy("createdAt")).subscribe({
      next: setPosts,
      error: () => setPosts([]),
    });
    return () => {
      subscription.unsubscribe();
      setPosts([]);
    };
  }, [userId]);

  return posts;
}
