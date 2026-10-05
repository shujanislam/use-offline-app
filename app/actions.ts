"use server";

import { getSessionUserId } from "@/lib/server/session";
import { addPost, applyToJob } from "@/lib/server/store";
import { validatePost } from "@/lib/posts";
import type { ActionResult } from "@/lib/types";

const SESSION_EXPIRED = "Your session has expired. Sign in again.";

const POST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `id` is a client-generated UUID that makes the call safe to repeat.
 * `authorId` is who wrote it on the device: a post queued offline must not
 * be published by whoever is signed in when it's finally sent.
 */
export async function createPost(id: string, authorId: string, body: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: SESSION_EXPIRED };
  if (userId !== authorId) return { ok: false, error: "You're signed in as a different user." };
  if (typeof id !== "string" || !POST_ID.test(id)) return { ok: false, error: "Invalid post." };
  const post = validatePost(body);
  if (!post.ok) return post;
  addPost(userId, id, post.text);
  return { ok: true };
}

export async function applyForJob(jobId: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: SESSION_EXPIRED };
  if (!applyToJob(userId, jobId)) return { ok: false, error: "This job no longer exists." };
  return { ok: true };
}
