import { ResetForm } from "@/components/PasswordReset";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "New password" };

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <AuthShell>
      <ResetForm token={!error && token ? token : null} />
    </AuthShell>
  );
}
