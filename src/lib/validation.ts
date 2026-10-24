import { z } from "zod";
import { isValidTimezone } from "./time";

// Shared field rules (PLAYBOOK §10 Validation): every string trimmed and length-limited.
export const text = (max = 100) => z.string().trim().min(1, "Required").max(max, `Must be at most ${max} characters`);
export const id = z.string().uuid("Invalid id");
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").refine((d) => !Number.isNaN(Date.parse(d)), "Invalid date");
export const email = z.string().trim().toLowerCase().max(254).email("Enter a valid email");
export const currency = z
  .string()
  .trim()
  .toUpperCase()
  .refine((c) => Intl.supportedValuesOf("currency").includes(c), "Unknown currency code");
export const timezone = z.string().trim().refine(isValidTimezone, "Unknown timezone");
export const amount = z.string().trim().min(1, "Required").max(20);
