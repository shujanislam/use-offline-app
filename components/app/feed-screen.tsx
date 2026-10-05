"use client";

import { useState } from "react";
import { useOffline } from "next/offline";
import { createPost } from "@/app/actions";
import { CachedContent } from "@/components/offline/cached-content";
import { formatAge } from "@/components/offline/freshness";
import { discardPost, enqueuePost, retryPost, usePendingPosts } from "@/lib/offline/outbox";
import { invalidate } from "@/lib/offline/resource";
import { useOnlineAction } from "@/lib/offline/use-online-action";
import { validatePost } from "@/lib/posts";
import { useFeed } from "@/lib/repositories/feed-repository";
import { useSession } from "@/lib/session/session-context";
import { useNow } from "@/lib/use-now";
import { ActionMessage } from "./action-message";

export function FeedScreen() {
  const feed = useFeed();
  const now = useNow();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Feed</h1>
      <Composer />
      <PendingPosts />
      <CachedContent query={feed}>
        {(posts) => (
          <ul className="space-y-3" data-testid="feed-list">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p>{post.body}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {post.authorName} · {formatAge(post.createdAt, now)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CachedContent>
    </div>
  );
}

const QUEUED_POST_MESSAGE = "You're offline. Your post will be published when you're back online.";

function Composer() {
  const { user } = useSession();
  const [body, setBody] = useState("");
  const [queued, setQueued] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const post = useOnlineAction(createPost, {
    onSuccess: () => {
      setBody("");
      invalidate("feed");
    },
  });

  // Offline: validate now, save to the outbox, and let OutboxSync send it.
  async function queue(userId: string) {
    const valid = validatePost(body);
    if (!valid.ok) return setQueueError(valid.error);
    try {
      await enqueuePost(userId, valid.text);
    } catch {
      return setQueueError("Couldn't save your post on this device. Please try again.");
    }
    setBody("");
    setQueued(true);
  }

  function submit() {
    setQueued(false);
    setQueueError(null);
    if (!user) return;
    if (post.offline) void queue(user.id);
    else post.run(crypto.randomUUID(), user.id, body);
  }

  // The queued notice disappears once we're back online; PendingPosts shows progress.
  const message = queueError ?? (queued && post.offline ? QUEUED_POST_MESSAGE : post.message);

  const label =
    post.status === "waiting-for-connection" ? "Waiting for connection…" : post.pending ? "Posting…" : "Post";

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        aria-label="New post"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-neutral-300 bg-white p-3"
        placeholder="Share an update"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={post.pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {label}
        </button>
        <ActionMessage message={message} />
      </div>
    </form>
  );
}

/** Posts saved on this device that haven't reached the server yet. */
function PendingPosts() {
  const { user } = useSession();
  const offline = useOffline();
  const posts = usePendingPosts(user?.id);
  if (posts.length === 0) return null;

  return (
    <ul className="space-y-3" data-testid="pending-posts">
      {posts.map((post) => (
        <li key={post.id} className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4" data-status={post.status}>
          <p>{post.body}</p>
          {post.status === "queued" ? (
            <p className="mt-2 text-xs text-amber-800">
              {offline ? "Pending · will be posted when you're back online" : "Posting…"}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-red-800">Not posted: {post.error}</span>
              <button className="underline" onClick={() => void retryPost(post.id)}>
                Retry
              </button>
              <button className="underline" onClick={() => void discardPost(post.id)}>
                Discard
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
