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

  test("the dev mail sink does not exist in a production build", async ({ page }) => {
    const res = await page.goto("/dev/mail");
    expect(res?.status()).toBe(404);
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
