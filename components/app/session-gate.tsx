"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/session-context";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "authenticated") return children;
  if (status === "offline-unknown") {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center">
        <p className="font-medium">Signing in requires an internet connection.</p>
        <p className="mt-1 text-sm text-neutral-500">There&apos;s no saved session on this device yet.</p>
      </div>
    );
  }
  return <p className="text-sm text-neutral-500">Loading…</p>;
}
