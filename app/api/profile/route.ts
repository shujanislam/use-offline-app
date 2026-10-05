import { withUser } from "@/lib/server/api";
import { getProfile } from "@/lib/server/store";

export function GET() {
  return withUser((userId) => getProfile(userId));
}
