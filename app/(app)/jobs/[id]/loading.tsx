import { ConnectivityFallback } from "@/components/offline/connectivity-fallback";

export default function Loading() {
  return <ConnectivityFallback what="this job" />;
}
