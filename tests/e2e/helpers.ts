import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "campusly-demo-1";
export const SCHOOL = "/s/maple-grove-school";

/** Fail the test on any console error (PLAYBOOK §20.1 "no console errors"). */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return () => expect(errors, "console errors").toEqual([]);
}

export async function signIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/schools");
}

export async function signUp(page: Page, name: string, email: string, next?: string) {
  await page.goto(next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(next ? `**${next}` : "**/schools");
}

/** No horizontal page scroll at phone width. */
export async function expectNoOverflow(page: Page) {
  const { scroll, width, culprits } = await page.evaluate(() => {
    const width = window.innerWidth;
    const culprits = [...document.querySelectorAll("body *")]
      .filter((e) => e.getBoundingClientRect().right > width + 1 && !e.parentElement?.closest(".overflow-x-auto"))
      .slice(0, 3)
      .map((e) => `<${e.tagName.toLowerCase()} class="${String(e.className).slice(0, 60)}">`);
    return { scroll: document.documentElement.scrollWidth, width, culprits };
  });
  expect(scroll, `horizontal overflow on ${page.url()}: ${culprits.join(", ")}`).toBeLessThanOrEqual(width);
}
