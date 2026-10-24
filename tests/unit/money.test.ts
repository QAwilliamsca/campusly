import { describe, expect, it } from "vitest";
import { formatMoney, toMinor } from "@/lib/money";

describe("money — integer minor units, never floats (PLAYBOOK §10, §20.5)", () => {
  it("parses decimals into minor units by currency", () => {
    expect(toMinor("12.50", "USD")).toBe(1250);
    expect(toMinor("0.1", "USD")).toBe(10);
    expect(toMinor("1000", "JPY")).toBe(1000); // JPY has 0 decimals
    expect(toMinor("1.234", "KWD")).toBe(1234); // KWD has 3 decimals
    expect(toMinor(" 7 ", "EUR")).toBe(700);
  });

  it("avoids float rounding traps", () => {
    expect(toMinor("0.29", "USD")).toBe(29); // 0.29 * 100 = 28.999999999999996 in floats
    expect(toMinor("19.99", "USD")).toBe(1999);
  });

  it("rejects bad input", () => {
    for (const bad of ["", "abc", "-5", "1.999", "1e3", "12,50", "  "]) {
      expect(() => toMinor(bad, "USD"), bad).toThrow();
    }
    expect(() => toMinor("1.5", "JPY")).toThrow();
  });

  it("formats minor units for display", () => {
    expect(formatMoney(1250, "USD", "en-US")).toBe("$12.50");
    expect(formatMoney(1000, "JPY", "en-US")).toBe("¥1,000");
  });
});
