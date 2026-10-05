"use client";

import Link from "next/link";
import { applyForJob } from "@/app/actions";
import { CachedContent } from "@/components/offline/cached-content";
import { invalidate } from "@/lib/offline/resource";
import { useOnlineAction } from "@/lib/offline/use-online-action";
import { useJob, useJobs } from "@/lib/repositories/jobs-repository";
import { ActionMessage } from "./action-message";

export function JobsScreen() {
  const jobs = useJobs();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Jobs</h1>
      <CachedContent query={jobs}>
        {(list) => (
          <ul className="space-y-3" data-testid="jobs-list">
            {list.map((job) => (
              <li key={job.id}>
                {/* Full prefetch: job pages are a likely next step, so make
                    them navigable offline, not just their loading shell. */}
                <Link
                  href={`/jobs/${job.id}`}
                  prefetch={true}
                  className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
                >
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-neutral-500">
                    {job.company} · {job.location}
                    {job.applied && " · Applied"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CachedContent>
    </div>
  );
}

export function JobDetailScreen({ id }: { id: string }) {
  const job = useJob(id);
  return (
    <div className="space-y-4">
      <Link href="/jobs" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← All jobs
      </Link>
      <CachedContent query={job}>
        {(job) => (
          <article className="space-y-3">
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <p className="text-neutral-500">
              {job.company} · {job.location}
            </p>
            <p>{job.description}</p>
            <ApplyButton jobId={job.id} applied={job.applied} />
          </article>
        )}
      </CachedContent>
    </div>
  );
}

function ApplyButton({ jobId, applied }: { jobId: string; applied: boolean }) {
  const apply = useOnlineAction(applyForJob, { onSuccess: () => invalidate("jobs") });

  if (applied) return <p className="font-medium text-emerald-700">You applied to this job.</p>;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => apply.run(jobId)}
        disabled={apply.pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {apply.status === "waiting-for-connection" ? "Waiting for connection…" : apply.pending ? "Applying…" : "Apply"}
      </button>
      <ActionMessage message={apply.message} />
    </div>
  );
}
