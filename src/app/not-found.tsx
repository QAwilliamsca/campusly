import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="mt-2 text-muted">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/schools" className="btn-secondary mt-6">Go to your schools</Link>
      </div>
    </main>
  );
}
