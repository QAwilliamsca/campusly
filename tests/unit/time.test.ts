import { describe, expect, it } from "vitest";
import { todayIn } from "@/lib/time";

describe("todayIn — 'today' is the school's date, not the server's (PLAYBOOK §20.2 Time)", () => {
  const instant = new Date("2026-03-01T02:30:00Z"); // 02:30 UTC on 1 March

  it("is the same calendar day in UTC", () => expect(todayIn("UTC", instant)).toBe("2026-03-01"));
  it("is still the previous day in New York", () => expect(todayIn("America/New_York", instant)).toBe("2026-02-28"));
  it("is already morning in Tokyo", () => expect(todayIn("Asia/Tokyo", instant)).toBe("2026-03-01"));
  it("handles leap years", () => expect(todayIn("America/Los_Angeles", new Date("2028-03-01T05:00:00Z"))).toBe("2028-02-29"));
});
