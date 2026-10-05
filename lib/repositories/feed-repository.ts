import { defineResource } from "@/lib/offline/resource";
import { useCachedQuery } from "@/lib/offline/use-cached-query";
import type { Post } from "@/lib/types";

export const feedResource = defineResource<Post[]>({ table: "feed", key: "list", url: "/api/feed" });

export function useFeed() {
  return useCachedQuery(feedResource);
}
