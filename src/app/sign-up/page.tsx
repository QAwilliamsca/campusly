import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { googleEnabled } from "@/lib/auth";
import { demoMode } from "@/lib/demo";
import { safeNext } from "@/lib/session";
import { mailSinkEnabled } from "@/lib/mail";

export const metadata = { title: "Create account" };

export default async function SignUp({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      {demoMode() ? (
        <div className="card w-full max-w-sm p-6">
          <h1 className="text-xl font-semibold">Sign-ups are closed on this demo</h1>
          <p className="mt-2 text-sm text-muted">This is a classroom demo of Campusly. Sign in with one of the demo accounts instead.</p>
          <Link href="/sign-in" className="btn-primary mt-5 w-full">Go to sign in</Link>
        </div>
      ) : (
        <AuthForm mode="sign-up" next={safeNext(next)} google={googleEnabled()} sinkHint={mailSinkEnabled()} />
      )}
    </main>
  );
}
