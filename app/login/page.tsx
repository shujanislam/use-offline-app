import type { Metadata } from "next";
import { LoginForm } from "@/components/app/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-neutral-500">Demo accounts. Pick one.</p>
      <LoginForm />
    </main>
  );
}
