import { eventsResource } from "@/lib/repositories/events-repository";
import { feedResource } from "@/lib/repositories/feed-repository";
import { jobsResource } from "@/lib/repositories/jobs-repository";
import { profileResource } from "@/lib/repositories/profile-repository";

/** Small, high-value datasets saved for offline reading after sign-in. */
const OFFLINE_RESOURCES = [feedResource, jobsResource, eventsResource, profileResource];

/** Saved data younger than this isn't re-fetched by the warmer. */
const WARM_MAX_AGE_MS = 5 * 60 * 1000;

export async function warmOfflineData(userId: string) {
  // Sequential and best-effort: this is background work and must not
  // compete with what the user is looking at.
  for (const resource of OFFLINE_RESOURCES) {
    try {
      const saved = await resource.readCache(userId);
      if (saved && Date.now() - saved.cachedAt < WARM_MAX_AGE_MS) continue;
      await resource.fetchFresh(userId);
    } catch {
      return; // Offline or server trouble; try again next session.
    }
  }
}
