import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/redirect";

describe("safeNext — only same-site paths after sign-in (red-team #3)", () => {
  it("keeps normal in-app paths", () => {
    expect(safeNext("/s/maple/students?q=a#x")).toBe("/s/maple/students?q=a#x");
    expect(safeNext("/invite/abc")).toBe("/invite/abc");
  });
  it("blocks every off-site trick", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "", undefined, 42]) {
      expect(safeNext(bad), String(bad)).toBe("/schools");
    }
  });
});
