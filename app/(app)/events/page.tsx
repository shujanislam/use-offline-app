import type { Metadata } from "next";
import { EventsScreen } from "@/components/app/events-screen";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return <EventsScreen />;
}
