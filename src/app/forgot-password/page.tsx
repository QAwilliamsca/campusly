import { ForgotForm } from "@/components/PasswordReset";
import { AuthShell } from "@/components/AuthShell";
import { mailSinkEnabled } from "@/lib/mail";

export const metadata = { title: "Reset password" };

export default function ForgotPassword() {
  return (
    <AuthShell>
      <ForgotForm sinkHint={mailSinkEnabled()} />
    </AuthShell>
  );
}
