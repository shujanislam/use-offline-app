"use client";

import { useRouter } from "next/navigation";
import { useOnlineAction } from "@/lib/offline/use-online-action";
import { signIn } from "@/lib/session/auth";
import { ActionMessage } from "./action-message";

const DEMO_USERS = [
  { id: "alice", name: "Alice Archer" },
  { id: "bob", name: "Bob Baker" },
];

export function LoginForm() {
  const router = useRouter();
  const login = useOnlineAction(signIn, { onSuccess: () => router.replace("/feed") });

  return (
    <div className="space-y-3">
      {DEMO_USERS.map((user) => (
        <button
          key={user.id}
          onClick={() => login.run(user.id)}
          disabled={login.pending}
          className="block w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-left hover:border-neutral-500 disabled:opacity-50"
        >
          Continue as {user.name}
        </button>
      ))}
      <ActionMessage message={login.message} />
    </div>
  );
}
