/**
 * Demo mode (D-015) for the public class demo: sign-up is closed (there is no mail provider to verify new
 * emails, D-010) and the sign-in page lists the seeded demo accounts. Switch on with DEMO_MODE=1.
 */
export const demoMode = () => process.env.DEMO_MODE === "1";

// Fictional people created by scripts/seed.ts — keep the two in sync.
export const DEMO_ACCOUNTS = [
  { email: "principal@example.com", who: "Owner / principal" },
  { email: "admin@example.com", who: "Admin" },
  { email: "teacher@example.com", who: "Teacher, Grade 5-A" },
  { email: "teacher2@example.com", who: "Teacher, Grade 6-B" },
  { email: "parent@example.com", who: "Parent of two" },
  { email: "student@example.com", who: "Student" },
] as const;
