import type { Metadata } from "next";
import { JobsScreen } from "@/components/app/jobs-screen";

export const metadata: Metadata = { title: "Jobs" };

export default function JobsPage() {
  return <JobsScreen />;
}
