import { ForgotForm } from "@/components/PasswordReset";
import { mailSinkEnabled } from "@/lib/mail";

export const metadata = { title: "Reset password" };

export default function ForgotPassword() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <ForgotForm sinkHint={mailSinkEnabled()} />
    </main>
  );
}
