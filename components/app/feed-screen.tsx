"use client";

import { useState } from "react";
import { createPost } from "@/app/actions";
import { CachedContent } from "@/components/offline/cached-content";
import { formatAge } from "@/components/offline/freshness";
import { invalidate } from "@/lib/offline/resource";
import { useOnlineAction } from "@/lib/offline/use-online-action";
import { useFeed } from "@/lib/repositories/feed-repository";
import { useNow } from "@/lib/use-now";
import { ActionMessage } from "./action-message";

export function FeedScreen() {
  const feed = useFeed();
  const now = useNow();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Feed</h1>
      <Composer />
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

function Composer() {
  const [body, setBody] = useState("");
  const post = useOnlineAction(createPost, {
    onSuccess: () => {
      setBody("");
      invalidate("feed");
    },
  });

  const label =
    post.status === "waiting-for-connection" ? "Waiting for connection…" : post.pending ? "Posting…" : "Post";

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        post.run(body);
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
        <ActionMessage message={post.message} />
      </div>
    </form>
  );
}
