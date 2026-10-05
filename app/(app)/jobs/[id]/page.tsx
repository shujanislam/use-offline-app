import { JobDetailScreen } from "@/components/app/jobs-screen";

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  return <JobDetailScreen id={id} />;
}
