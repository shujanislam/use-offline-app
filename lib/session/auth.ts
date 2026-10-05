import { clearUserData } from "@/lib/offline/db";
import { OFFLINE_ACTION_MESSAGE } from "@/lib/offline/use-online-action";
import type { ActionResult, User } from "@/lib/types";
import { rememberUser } from "./session-context";

export async function signIn(userId: string): Promise<ActionResult> {
  let response: Response;
  try {
    response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch {
    return { ok: false, error: OFFLINE_ACTION_MESSAGE };
  }
  if (!response.ok) return { ok: false, error: "Sign-in failed." };
  await rememberUser((await response.json()) as User);
  return { ok: true };
}

/**
 * Ends the server session, then removes this user's saved data from the
 * device. Requires a connection: the session cookie is httpOnly, so only
 * the server can clear it.
 */
export async function signOut(): Promise<ActionResult> {
  try {
    const response = await fetch("/api/session", { method: "DELETE" });
    if (!response.ok) return { ok: false, error: "Sign-out failed." };
  } catch {
    return { ok: false, error: OFFLINE_ACTION_MESSAGE };
  }
  await clearUserData();
  return { ok: true };
}
