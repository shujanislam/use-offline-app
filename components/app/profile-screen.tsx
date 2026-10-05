"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CachedContent } from "@/components/offline/cached-content";
import { usePendingPosts } from "@/lib/offline/outbox";
import { useOnlineAction } from "@/lib/offline/use-online-action";
import { useProfile } from "@/lib/repositories/profile-repository";
import { signOut } from "@/lib/session/auth";
import { useSession } from "@/lib/session/session-context";
import { ActionMessage } from "./action-message";

export function ProfileScreen() {
  const router = useRouter();
  const profile = useProfile();
  // /login is outside the (app) layout, so every component holding this
  // user's data unmounts. The Router Cache only holds user-independent shells.
  const signOutAction = useOnlineAction(signOut, { onSuccess: () => router.replace("/login") });
  // Signing out clears this device's data, including posts that were never sent.
  const unsent = usePendingPosts(useSession().user?.id).length;
  const [confirming, setConfirming] = useState(false);
  const warning =
    confirming && unsent > 0
      ? `You have ${unsent} unsent ${unsent === 1 ? "post" : "posts"}. Signing out will discard ${unsent === 1 ? "it" : "them"}.`
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <CachedContent query={profile}>
        {(me) => (
          <section className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4" data-testid="profile">
            <p className="text-lg font-medium">{me.name}</p>
            <p className="text-neutral-500">{me.headline}</p>
            <p>{me.bio}</p>
            <ul className="flex flex-wrap gap-2">
              {me.skills.map((skill) => (
                <li key={skill} className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}
      </CachedContent>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (unsent > 0 && !confirming) return setConfirming(true);
            signOutAction.run();
          }}
          disabled={signOutAction.pending}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          {warning ? "Sign out anyway" : "Sign out"}
        </button>
        <ActionMessage message={signOutAction.message ?? warning} />
      </div>
    </div>
  );
}
