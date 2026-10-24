import { AuthForm } from "@/components/AuthForm";
import { googleEnabled } from "@/lib/auth";
import { safeNext } from "@/lib/session";

export const metadata = { title: "Create account" };

export default async function SignUp({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <AuthForm mode="sign-up" next={safeNext(next)} google={googleEnabled()} />
    </main>
  );
}
