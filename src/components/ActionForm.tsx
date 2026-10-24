"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Result } from "@/lib/result";

type Action = (prev: Result, fd: FormData) => Promise<Result>;

/**
 * Every mutating form goes through this: shows errors/success accessibly and,
 * with `idempotent`, sends a fresh key per submission so a double click on the
 * server is a no-op (PLAYBOOK §20.2).
 */
export function ActionForm({
  action,
  children,
  className,
  idempotent,
  resetOnSuccess,
  encType,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  idempotent?: boolean;
  resetOnSuccess?: boolean;
  encType?: "multipart/form-data";
}) {
  const [state, formAction] = useActionState(action, null);
  const [base] = useState(() => crypto.randomUUID());
  // Same key until a submission succeeds, so a double click or a retry after a network error is a no-op.
  const key = `${base}-${state?.ok ? state.at : 0}`;
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className} encType={encType}>
      {idempotent && <input type="hidden" name="idempotencyKey" value={key} />}
      {children}
      <div aria-live="polite" className="basis-full">
        {state && !state.ok && (
          <p role="alert" className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state?.ok && state.message && <p className="mt-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">{state.message}</p>}
      </div>
    </form>
  );
}

/** Disabled while the request is in flight — the first half of double-submit protection. */
export function SubmitButton({ children, variant = "primary", pendingText = "Saving…" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger"; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={`btn-${variant}`}>
      {pending ? pendingText : children}
    </button>
  );
}
