import { defineResource } from "@/lib/offline/resource";
import { useCachedQuery } from "@/lib/offline/use-cached-query";
import type { Event } from "@/lib/types";

export const eventsResource = defineResource<Event[]>({ table: "events", key: "list", url: "/api/events" });

export function useEvents() {
  return useCachedQuery(eventsResource);
}
