import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-16">
      <h1 className="text-3xl font-semibold">Offline-first demo</h1>
      <p className="text-neutral-600">
        Browse once while online. Your feed, jobs, events and profile stay readable when the connection drops.
      </p>
      <div className="flex gap-3">
        <Link href="/feed" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Open the app
        </Link>
        <Link href="/login" className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
          Sign in
        </Link>
      </div>
    </main>
  );
}
