import { expect, test } from "@playwright/test";
import { SCHOOL, expectNoOverflow, watchConsole } from "./helpers";

test.describe("public pages", () => {
  for (const path of ["/", "/sign-in", "/sign-up"]) {
    test(`${path} loads without errors and fits 375px`, async ({ page }) => {
      const check = watchConsole(page);
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoOverflow(page);
      check();
    });
  }

  test("health endpoint answers", async ({ request }) => {
    expect(await (await request.get("/api/health")).json()).toEqual({ ok: true });
  });

  test("signed-out users are sent to sign-in, and come back after", async ({ page }) => {
    await page.goto(`${SCHOOL}/students`);
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fs%2Fmaple-grove-school/);
  });

  test("open redirects are blocked", async ({ page }) => {
    await page.goto("/sign-in?next=//evil.example.com");
    await page.getByLabel("Email").fill("principal@example.com");
    await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD || "campusly-demo-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/schools");
  });

  test("unverified accounts cannot sign in (D-010)", async ({ page }) => {
    const email = `unverified-${Date.now()}@example.com`;
    await page.goto("/sign-up");
    await page.getByLabel("Full name").fill("Not Verified");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("campusly-demo-1");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("campusly-demo-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form [role=alert]")).toContainText("Verify your email first");
  });

  test("password reset: request, follow the link, sign in with the new password", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("student@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("If an account exists");
    await page.goto("/dev/mail");
    const body = await page.locator("li", { hasText: "reset-password · to s***@example.com" }).first().locator("pre").textContent();
    await page.goto(body!.match(/https?:\/\/\S+/)![0]);
    await page.getByLabel("New password").fill("a-brand-new-password-1");
    await page.getByRole("button", { name: "Set password" }).click();
    await expect(page.getByRole("status")).toContainText("Password changed");
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("student@example.com");
    await page.getByLabel("Password").fill("a-brand-new-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/schools");
  });

  test("open-redirect tricks land on /schools, not off-site (red-team #3)", async ({ page }) => {
    await page.goto("/sign-in?next=%2F%09%2Fevil.example.com");
    await page.getByLabel("Email").fill("principal@example.com");
    await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD || "campusly-demo-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/schools");
  });

  test("security headers are set", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
  });

  test("wrong password shows a friendly error", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("principal@example.com");
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
