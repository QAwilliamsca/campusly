"use client";

import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";

const auth = createAuthClient();

export function SignOut() {
  const router = useRouter();
  return (
    <button type="button" className="btn-secondary" onClick={async () => { await auth.signOut(); router.push("/sign-in"); router.refresh(); }}>
      Sign out
    </button>
  );
}
