import { defineResource } from "@/lib/offline/resource";
import { useCachedQuery } from "@/lib/offline/use-cached-query";
import type { Profile } from "@/lib/types";

export const profileResource = defineResource<Profile>({ table: "profile", key: "me", url: "/api/profile" });

export function useProfile() {
  return useCachedQuery(profileResource);
}
