"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";

const auth = createAuthClient();

export function AuthForm({ mode, next, google, defaultEmail }: { mode: "sign-in" | "sign-up"; next: string; google: boolean; defaultEmail?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim().toLowerCase();
    const password = String(fd.get("password"));
    const res =
      mode === "sign-up"
        ? await auth.signUp.email({ name: String(fd.get("name")).trim(), email, password })
        : await auth.signIn.email({ email, password });
    if (res.error) {
      setPending(false);
      const status = res.error.status;
      setError(
        status === 429
          ? "Too many attempts. Wait a minute and try again."
          : mode === "sign-up" && status === 422
            ? "An account with this email already exists. Sign in instead."
            : (res.error.message ?? "Something went wrong."),
      );
      return;
    }
    router.push(next);
    router.refresh();
  }

  const other = mode === "sign-in" ? "/sign-up" : "/sign-in";
  return (
    <div className="card w-full max-w-sm p-6">
      <h1 className="text-xl font-semibold">{mode === "sign-in" ? "Sign in to Campusly" : "Create your account"}</h1>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {mode === "sign-up" && (
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" name="name" required maxLength={100} autoComplete="name" className="input" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={defaultEmail} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={mode === "sign-up" ? 10 : 1} maxLength={128} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="input" aria-describedby={mode === "sign-up" ? "pw-hint" : undefined} />
          {mode === "sign-up" && <p id="pw-hint" className="mt-1 text-xs text-muted">At least 10 characters.</p>}
        </div>
        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>
      {google && (
        <button type="button" className="btn-secondary mt-3 w-full" onClick={() => auth.signIn.social({ provider: "google", callbackURL: next })}>
          Continue with Google
        </button>
      )}
      <p className="mt-5 text-center text-sm text-muted">
        {mode === "sign-in" ? "New to Campusly?" : "Already have an account?"}{" "}
        <Link className="font-medium text-accent underline-offset-2 hover:underline" href={`${other}?next=${encodeURIComponent(next)}`}>
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
