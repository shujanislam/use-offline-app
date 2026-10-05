"use server";

import { getSessionUserId } from "@/lib/server/session";
import { addPost, applyToJob } from "@/lib/server/store";
import type { ActionResult } from "@/lib/types";

export async function createPost(body: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Your session has expired. Sign in again." };
  const text = body.trim();
  if (!text) return { ok: false, error: "Write something first." };
  if (text.length > 500) return { ok: false, error: "Posts are limited to 500 characters." };
  addPost(userId, text);
  return { ok: true };
}

export async function applyForJob(jobId: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!applyToJob(userId, jobId)) return { ok: false, error: "This job no longer exists." };
  return { ok: true };
}
