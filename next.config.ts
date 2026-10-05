import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  experimental: {
    // Connectivity detection + automatic retry of navigations, prefetches and
    // Server Actions. Exposes `useOffline()` from `next/offline`.
    useOffline: true,
  },
};

export default withSerwist(nextConfig);
