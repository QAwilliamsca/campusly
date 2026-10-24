import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "drizzle/**", "playwright-report/**", "test-results/**"] },
  {
    // Tenancy wall (PLAYBOOK §10): feature code must go through the scoped client.
    files: ["src/**/*.{ts,tsx}"],
    // Allowed raw-DB users: the db layer itself, auth/session plumbing, signed file + health routes,
    // the dev mail sink, and the pre-tenant /schools pages (create school, accept invite) that run
    // before any school is chosen.
    ignores: ["src/db/**", "src/lib/auth.ts", "src/lib/session.ts", "src/app/api/**", "src/app/dev/**", "src/app/schools/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "@/db/client", message: "Use ctx.s (scoped client) — see docs/ENGINEERING_GUIDE.md §4." }] }],
    },
  },
];

export default config;
