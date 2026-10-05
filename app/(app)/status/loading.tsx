import { ConnectivityFallback } from "@/components/offline/connectivity-fallback";

export default function Loading() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Live status</h1>
      <ConnectivityFallback what="live status" />
    </div>
  );
}
