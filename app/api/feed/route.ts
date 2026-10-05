import { withUser } from "@/lib/server/api";
import { listPosts } from "@/lib/server/store";

export function GET() {
  return withUser(() => listPosts());
}
