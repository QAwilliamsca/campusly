import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { googleEnabled } from "@/lib/auth";
import { DEMO_ACCOUNTS, demoMode } from "@/lib/demo";
import { safeNext } from "@/lib/session";
import { mailSinkEnabled } from "@/lib/mail";

export const metadata = { title: "Sign in" };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="sign-in" next={safeNext(next)} google={googleEnabled()} sinkHint={mailSinkEnabled()} />
      {demoMode() && (
        <section className="card w-full max-w-sm p-5" aria-labelledby="demo-accounts">
          <h2 id="demo-accounts" className="font-semibold">Demo accounts</h2>
          <p className="mt-1 text-sm text-muted">
            Fictional people. Every password is <code className="font-mono text-text">{process.env.DEMO_PASSWORD || "campusly-demo-1"}</code>.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex justify-between gap-3">
                <span className="font-mono [overflow-wrap:anywhere]">{a.email}</span>
                <span className="shrink-0 text-muted">{a.who}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AuthShell>
  );
}
