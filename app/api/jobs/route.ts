import { withUser } from "@/lib/server/api";
import { listJobs } from "@/lib/server/store";

export function GET() {
  return withUser((userId) => listJobs(userId));
}
