import { withUser } from "@/lib/server/api";
import { listEvents } from "@/lib/server/store";

export function GET() {
  return withUser(() => listEvents());
}
