import { expect, test } from "@playwright/test";
import { SCHOOL, expectNoOverflow, signIn, signUp, watchConsole } from "./helpers";

// Seeded demo school: Daniel teaches Grade 5-A (6 students); Maria is Leo's parent; Leo is a student.

test("principal sees every main screen without errors, at desktop and phone width", async ({ page }) => {
  const check = watchConsole(page);
  await signIn(page, "principal@example.com");
  for (const p of ["", "/students", "/classes", "/attendance", "/exams", "/fees", "/members", "/audit", "/settings"]) {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(SCHOOL + p);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByText(/NaN|undefined|Infinity/)).toHaveCount(0);
      await expectNoOverflow(page);
    }
  }
  check();
});

test("teacher sees only their class and no admin screens", async ({ page }) => {
  await signIn(page, "teacher@example.com");
  await page.goto(`${SCHOOL}/students`);
  await expect(page.getByText("6 student(s) in your classes")).toBeVisible();
  await expect(page.getByRole("link", { name: "Fees" })).toHaveCount(0);
  for (const p of ["/fees", "/members", "/audit", "/settings", "/classes"]) {
    const res = await page.goto(SCHOOL + p);
    expect(res?.status(), p).toBe(404);
  }
});

test("parent sees only their own child; a real sibling's URL is not found (no IDOR)", async ({ page, browser }) => {
  const staff = await (await browser.newContext()).newPage();
  await signIn(staff, "principal@example.com");
  await staff.goto(`${SCHOOL}/students`);
  const aishaUrl = await staff.getByRole("link", { name: "Aisha Khan" }).getAttribute("href");

  await signIn(page, "parent@example.com");
  await page.goto(SCHOOL);
  await expect(page.getByRole("heading", { name: "Your children" })).toBeVisible();
  await expect(page.getByText("Leo Santos")).toBeVisible();
  await expect(page.getByText("Aisha Khan")).toHaveCount(0);
  await page.getByText("Leo Santos").click();
  await expect(page.getByRole("heading", { name: "Report card" })).toBeVisible();
  await expect(page.getByText("Partly paid")).toBeVisible();
  expect((await page.goto(aishaUrl!))?.status()).toBe(404);
  for (const p of ["/students", "/fees", "/attendance"]) expect((await page.goto(SCHOOL + p))?.status(), p).toBe(404);
});

test("a user from another school gets 404 for this school", async ({ page }) => {
  await signUp(page, "Outsider Person", `outsider-${Date.now()}@example.com`);
  expect((await page.goto(SCHOOL))?.status()).toBe(404);
});
