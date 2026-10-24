import { ResetForm } from "@/components/PasswordReset";

export const metadata = { title: "New password" };

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <ResetForm token={!error && token ? token : null} />
    </main>
  );
}
