export const MAX_POST_LENGTH = 500;

/** Shared by the Server Action and the offline queue, so queued posts don't fail validation later. */
export function validatePost(body: string): { ok: true; text: string } | { ok: false; error: string } {
  const text = body.trim();
  if (!text) return { ok: false, error: "Write something first." };
  if (text.length > MAX_POST_LENGTH) return { ok: false, error: `Posts are limited to ${MAX_POST_LENGTH} characters.` };
  return { ok: true, text };
}
