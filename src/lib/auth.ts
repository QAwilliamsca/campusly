import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { sendMail } from "./mail";
import { serverSecret } from "./secret";
import { appUrl } from "./url";

export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

async function create() {
  const db = await getDb();
  return betterAuth({
    secret: serverSecret(),
    baseURL: process.env.BETTER_AUTH_URL || appUrl(),
    database: drizzleAdapter(db, { provider: "pg", schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification } }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      requireEmailVerification: true, // D-010
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) => sendMail(db, { to: user.email, template: "reset-password", subject: "Reset your Campusly password", text: `Reset your password: ${url}\n\nIf you didn't ask for this, ignore this email.` }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true, // signing in unverified re-sends the link
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) => sendMail(db, { to: user.email, template: "verify-email", subject: "Verify your email for Campusly", text: `Confirm your email: ${url}` }),
    },
    // Hidden until the founder creates the OAuth app (PLAYBOOK §9.4: social sign-in → button hidden).
    socialProviders: googleEnabled() ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } } : {},
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 }, // 30 days, rolling (PLAYBOOK §23)
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      // PLAYBOOK §23: auth endpoints 5/min/IP. AUTH_RATE_LIMIT only raised by the browser-test server.
      customRules: Object.fromEntries(
        ["/sign-in/email", "/sign-up/email", "/request-password-reset"].map((p) => [p, { window: 60, max: Number(process.env.AUTH_RATE_LIMIT || 5) }]),
      ),
    },
    databaseHooks: {
      user: { create: { before: async (u) => ({ data: { ...u, name: String(u.name ?? "").trim().slice(0, 100) || "New user" } }) } },
    },
    plugins: [nextCookies()],
  });
}

const g = globalThis as unknown as { campuslyAuth?: ReturnType<typeof create> };
export const getAuth = () => (g.campuslyAuth ??= create());
