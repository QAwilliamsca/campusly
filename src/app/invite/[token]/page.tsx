import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { currentUser } from "@/lib/session";
import { acceptInviteAction } from "@/app/schools/actions";

export const metadata = { title: "Accept invite" };

export default async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await currentUser();
  const here = `/invite/${token}`;
  return (
    <AuthShell>
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold">You&apos;ve been invited to Campusly</h1>
        {user ? (
          <>
            <p className="mt-2 text-sm text-muted">Signed in as <strong className="text-text">{user.email}</strong>. The invite must have been sent to this email.</p>
            <ActionForm action={acceptInviteAction} className="mt-5">
              <input type="hidden" name="token" value={token} />
              <SubmitButton pendingText="Joining…">Accept invite</SubmitButton>
            </ActionForm>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">Create an account (or sign in) with the email address the invite was sent to.</p>
            <div className="mt-5 flex gap-2">
              <Link className="btn-primary" href={`/sign-up?next=${encodeURIComponent(here)}`}>Create account</Link>
              <Link className="btn-secondary" href={`/sign-in?next=${encodeURIComponent(here)}`}>Sign in</Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
