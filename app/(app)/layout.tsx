import { AppNav } from "@/components/app/app-nav";
import { SessionGate } from "@/components/app/session-gate";
import { OfflineWarmup } from "@/components/offline/offline-warmup";
import { SessionProvider } from "@/lib/session/session-context";

// Everything under (app) is a static, user-independent shell. Private data is
// loaded client-side through the repositories, so shells are safe to
// prefetch and to cache in the Service Worker.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SessionProvider>
      <AppNav />
      <OfflineWarmup />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <SessionGate>{children}</SessionGate>
      </main>
    </SessionProvider>
  );
}
