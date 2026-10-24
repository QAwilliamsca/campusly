"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted">Please try again. If it keeps happening, share this reference: {error.digest ?? "n/a"}</p>
        <button onClick={reset} className="btn-primary mt-6">Try again</button>
      </div>
    </main>
  );
}
