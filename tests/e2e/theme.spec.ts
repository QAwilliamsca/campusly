import { expect, test } from "@playwright/test";
import { SCHOOL, expectNoOverflow, signIn } from "./helpers";

const toggle = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Switch between light and dark theme" });
const theme = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.dataset.theme);

test("the theme toggle is top-right on every kind of page", async ({ page }) => {
  await signIn(page, "principal@example.com");
  for (const path of ["/", "/sign-in", "/schools", SCHOOL, `${SCHOOL}/fees`]) {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const box = (await toggle(page).boundingBox())!;
      expect(box.x + box.width, path).toBeGreaterThan(width - 70); // pinned to the right edge
      expect(box.y, path).toBeLessThan(20); // at the top
      await expectNoOverflow(page);
    }
  }
});

test("first visit follows the OS setting; a click switches and is remembered", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/");
  expect(await theme(page)).toBe("dark");
  await toggle(page).click();
  expect(await theme(page)).toBe("light");
  await page.goto("/sign-in");
  expect(await theme(page)).toBe("light"); // remembered across pages, despite the dark OS setting
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(244, 249, 252)"); // Ocean & Amber light --bg (D-019)
});
