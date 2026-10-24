"use client";

import { useState } from "react";
import Link from "next/link";
import { createAuthClient } from "better-auth/react";

const auth = createAuthClient();

/** Request a reset link. Always answers the same way, so it never reveals whether an email has an account. */
export function ForgotForm({ sinkHint }: { sinkHint: boolean }) {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const email = String(new FormData(e.currentTarget).get("email")).trim().toLowerCase();
    await auth.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setDone(true);
  }
  return (
    <div className="card w-full max-w-sm p-6">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      {done ? (
        <p role="status" className="mt-3 text-sm text-muted">
          If an account exists for that email, a reset link is on its way.
          {sinkHint && <> Running locally? Open the <a className="text-accent underline" href="/dev/mail">mail sink</a>.</>}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="input" /></div>
          <button disabled={pending} className="btn-primary w-full">{pending ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <p className="mt-5 text-center text-sm"><Link className="text-accent hover:underline" href="/sign-in">Back to sign in</Link></p>
    </div>
  );
}

export function ResetForm({ token }: { token: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    const res = await auth.resetPassword({ newPassword: String(new FormData(e.currentTarget).get("password")), token });
    setPending(false);
    if (res.error) setError("This reset link is invalid or has expired. Request a new one.");
    else setDone(true);
  }
  return (
    <div className="card w-full max-w-sm p-6">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      {!token ? (
        <p role="alert" className="mt-3 text-sm text-danger">This reset link is invalid or has expired. <Link className="underline" href="/forgot-password">Request a new one</Link>.</p>
      ) : done ? (
        <p role="status" className="mt-3 text-sm text-muted">Password changed. Every other session was signed out. <Link className="text-accent underline" href="/sign-in">Sign in</Link></p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="input" aria-describedby="pw-hint" />
            <p id="pw-hint" className="mt-1 text-xs text-muted">At least 10 characters.</p>
          </div>
          {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <button disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Set password"}</button>
        </form>
      )}
    </div>
  );
}
