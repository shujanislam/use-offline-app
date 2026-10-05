import { privateJson, withUser } from "@/lib/server/api";
import { clearSession, setSession } from "@/lib/server/session";
import { getProfile, isKnownUser } from "@/lib/server/store";

export function GET() {
  return withUser((userId) => {
    const { id, name, headline } = getProfile(userId);
    return { id, name, headline };
  });
}

// Demo login: pick a seeded user. A real app keeps its existing auth flow.
export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId?: string };
  if (!userId || !isKnownUser(userId)) {
    return privateJson({ error: "unknown user" }, { status: 400 });
  }
  await setSession(userId);
  const { id, name, headline } = getProfile(userId);
  return privateJson({ id, name, headline });
}

export async function DELETE() {
  await clearSession();
  return privateJson({ ok: true });
}
