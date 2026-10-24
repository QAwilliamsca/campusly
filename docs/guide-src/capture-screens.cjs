const { createRequire } = require("module");
const req = createRequire(process.env.PROJECT + "/package.json");
const { chromium } = req("@playwright/test");
const OUT = process.env.PROJECT + "/docs/guide-img/";
const BASE = "http://localhost:3000";
const PW = "campusly-demo-1";
const S = "/s/maple-grove-school";

async function ctxFor(browser, opts = {}) {
  return browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, colorScheme: "light", ...opts });
}
let logins = 0;
async function login(page, email) {
  // Sign-in is rate-limited to 5/min per IP (PLAYBOOK §23) — pace the logins.
  await new Promise((r) => setTimeout(r, logins++ === 0 ? 61000 : 13000));
  const r = await page.request.post(BASE + "/api/auth/sign-in/email", { data: { email, password: PW }, headers: { origin: BASE } });
  if (r.status() !== 200) throw new Error("login " + email + " " + r.status());
}
async function shot(page, path, name, { full = false, wait = 600 } = {}) {
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(wait);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }); // hide the dev-only Next.js badge
  await page.screenshot({ path: OUT + name + ".png", fullPage: full });
  console.log("saved", name);
}

(async () => {
  const browser = await chromium.launch();
  // Public pages + brand
  let c = await ctxFor(browser); let p = await c.newPage();
  await shot(p, "/", "s01-landing");
  await shot(p, "/sign-in", "s02-sign-in");
  await shot(p, "/dev/brand", "s03-brand-kits", { wait: 1500 });
  // The chosen kit (D-019): light and dark side by side, cropped to the top of its section.
  await p.goto(BASE + "/dev/brand", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const box = await p.locator("#ocean").boundingBox();
  await p.screenshot({ path: OUT + "s03c-ocean-top.png", fullPage: true, clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 720) } });
  console.log("saved", "s03c-ocean-top");
  await c.close();

  // Principal
  c = await ctxFor(browser); p = await c.newPage(); await login(p, "principal@example.com");
  await shot(p, "/schools", "s04-school-picker");
  await shot(p, S, "s05-dashboard-principal");
  await shot(p, S + "/students", "s06-students", { full: true });
  await p.goto(BASE + S + "/students"); const leo = await p.getByRole("link", { name: "Leo Santos" }).getAttribute("href");
  const aisha = await p.getByRole("link", { name: "Aisha Khan" }).getAttribute("href");
  await shot(p, leo, "s07-student-leo", { full: true });
  await shot(p, S + "/classes", "s08-classes");
  await shot(p, S + "/attendance", "s09-attendance", { full: true });
  await shot(p, S + "/exams", "s10-exams");
  await shot(p, S + "/fees", "s11-fees", { full: true });
  await shot(p, S + "/fees", "s11a-fees-top");
  { // The invoices card on its own, cut to the first rows (a full table is too tall for a page).
    const card = p.locator("section", { has: p.getByRole("heading", { name: "Invoices", exact: true }) });
    const b = await card.boundingBox();
    await p.screenshot({ path: OUT + "s11b-fees-invoices.png", fullPage: true, clip: { x: b.x, y: b.y, width: b.width, height: Math.min(b.height, 760) } });
    console.log("saved", "s11b-fees-invoices");
  }
  await shot(p, S + "/members", "s12-members");
  await shot(p, S + "/audit", "s13-audit");
  await c.close();

  // Dark mode + phone
  c = await ctxFor(browser, { colorScheme: "dark" }); p = await c.newPage(); await login(p, "principal@example.com");
  await shot(p, S, "s14-dashboard-dark");
  await c.close();
  c = await ctxFor(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); p = await c.newPage(); await login(p, "principal@example.com");
  await shot(p, S + "/fees", "s15-phone-fees");
  await c.close();

  // Teacher
  c = await ctxFor(browser); p = await c.newPage(); await login(p, "teacher@example.com");
  await shot(p, S, "s16-dashboard-teacher");
  await shot(p, S + "/fees", "s17-teacher-fees-404");
  await c.close();

  // Parent
  c = await ctxFor(browser); p = await c.newPage(); await login(p, "parent@example.com");
  await shot(p, S, "s18-dashboard-parent");
  await shot(p, aisha, "s19-parent-sibling-404");
  await c.close();

  // Mail sink
  c = await ctxFor(browser); p = await c.newPage();
  await shot(p, "/dev/mail", "s20-mail-sink");
  await c.close();
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
