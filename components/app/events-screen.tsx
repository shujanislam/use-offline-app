"use client";

import { CachedContent } from "@/components/offline/cached-content";
import { useEvents } from "@/lib/repositories/events-repository";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function EventsScreen() {
  const events = useEvents();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <CachedContent query={events}>
        {(list) => (
          <ul className="space-y-3" data-testid="events-list">
            {list.map((event) => (
              <li key={event.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-neutral-500">
                  {dateFormat.format(event.startsAt)} · {event.venue}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CachedContent>
    </div>
  );
}
