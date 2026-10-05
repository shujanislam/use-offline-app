import { createSerwistRoute } from "@serwist/turbopack";
import { PRECACHED_SHELLS } from "@/lib/offline/routes";

// Generated once per build; changes the precache revision of the page shells.
const revision = crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: PRECACHED_SHELLS.map((url) => ({ url, revision })),
});
