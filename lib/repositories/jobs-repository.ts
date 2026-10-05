import { defineResource } from "@/lib/offline/resource";
import { useCachedQuery, type CachedQuery } from "@/lib/offline/use-cached-query";
import type { Job } from "@/lib/types";

export const jobsResource = defineResource<Job[]>({ table: "jobs", key: "list", url: "/api/jobs" });

export function useJobs() {
  return useCachedQuery(jobsResource);
}

/**
 * A single job, served from the jobs list so any job the user has seen in
 * the list is also readable offline.
 */
export function useJob(id: string): CachedQuery<Job | null> {
  const jobs = useJobs();
  return { ...jobs, data: jobs.data && (jobs.data.find((job) => job.id === id) ?? null) };
}
