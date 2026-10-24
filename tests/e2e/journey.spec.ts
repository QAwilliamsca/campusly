/**
 * The full story (PLAYBOOK §15 "Journeys"): a new school goes from sign-up to a
 * paid invoice, with an invited teacher and parent, each in their own browser.
 */
import { expect, test, type Page } from "@playwright/test";
import { signUp, watchConsole } from "./helpers";

test.describe.configure({ mode: "serial" });

const run = Date.now();
const email = (who: string) => `${who}-${run}@example.com`;
let owner: Page;
let slug = "";

async function inviteLink(page: Page, address: string, role: string, student?: string) {
  await page.goto(`/s/${slug}/members`);
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Role").selectOption(role);
  if (student) await page.getByLabel(/Student \(parents/).selectOption({ label: student });
  await page.getByRole("button", { name: "Send invite" }).click();
  const msg = await page.getByText(/share this link:/).textContent();
  return msg!.slice(msg!.indexOf("http"));
}

async function acceptAs(page: Page, name: string, address: string, link: string) {
  const path = new URL(link).pathname;
  await signUp(page, name, address, path);
  await page.getByRole("button", { name: "Accept invite" }).click();
  await page.waitForURL(`**/s/${slug}`);
}

test("owner signs up and creates a school", async ({ browser }) => {
  owner = await (await browser.newContext()).newPage();
  const check = watchConsole(owner);
  await signUp(owner, "Grace Hopper", email("owner"));
  await owner.getByLabel("School name").fill(`Journey Academy ${run}`);
  await owner.getByLabel("Currency").selectOption("EUR");
  await owner.getByRole("button", { name: "Create school" }).click();
  await owner.waitForURL("**/s/journey-academy-*");
  slug = new URL(owner.url()).pathname.split("/")[2]!;
  await expect(owner.getByText("No classes yet")).toBeVisible(); // designed empty state
  check();
});

test("owner creates a class and admits students (unicode names, sequential codes)", async () => {
  await owner.goto(`/s/${slug}/classes`);
  await owner.getByLabel("Class name").fill("Year 3");
  await owner.getByRole("button", { name: "Create class" }).click();
  await expect(owner.getByText('Class "Year 3" created.')).toBeVisible();

  await owner.goto(`/s/${slug}/students`);
  for (const [first, last, code] of [["Zoë", "O'Brien", "STU-0001"], ["आरव", "शर्मा", "STU-0002"]]) {
    await owner.getByLabel("First name").fill(first!);
    await owner.getByLabel("Last name").fill(last!);
    await owner.getByLabel("Class").selectOption({ label: "Year 3" });
    await owner.getByRole("button", { name: "Admit" }).click();
    await expect(owner.getByText(`${first} ${last} admitted as ${code}.`)).toBeVisible();
  }
  // HTML is shown as text, never executed.
  await owner.getByLabel("First name").fill("<script>alert(1)</script>");
  await owner.getByLabel("Last name").fill("Test");
  await owner.getByRole("button", { name: "Admit" }).click();
  await expect(owner.getByRole("link", { name: "<script>alert(1)</script> Test" })).toBeVisible();
});

test("teacher is invited, joins, gets assigned, and marks attendance", async ({ browser }) => {
  const link = await inviteLink(owner, email("teacher"), "teacher");
  const teacher = await (await browser.newContext()).newPage();
  await acceptAs(teacher, "Alan Turing", email("teacher"), link);

  await owner.goto(`/s/${slug}/classes`);
  await owner.getByLabel("Teacher for Year 3").selectOption({ label: "Alan Turing" });
  await owner.getByRole("button", { name: "Save" }).click();
  await expect(owner.getByText("Teacher updated.")).toBeVisible();

  await teacher.goto(`/s/${slug}/attendance`);
  await teacher.getByLabel("Zoë O'Brien: absent").check();
  await teacher.getByRole("button", { name: "Save attendance" }).click();
  await expect(teacher.getByText(/Saved attendance for 2 student\(s\)/)).toBeVisible();

  await teacher.goto(`/s/${slug}/exams`);
  await teacher.getByLabel("Exam").fill("Midterm");
  await teacher.getByLabel("Subject").fill("Reading");
  await teacher.getByLabel("Max marks").fill("20");
  await teacher.getByRole("button", { name: "Create exam" }).click();
  await teacher.getByRole("link", { name: "Enter marks" }).click();
  // The browser's max=20 would block this; remove it like an attacker would, to prove the SERVER refuses.
  await teacher.getByLabel("Zoë O'Brien").evaluate((el) => el.removeAttribute("max"));
  await teacher.getByLabel("Zoë O'Brien").fill("25");
  await teacher.getByRole("button", { name: "Save marks" }).click();
  await expect(teacher.locator("form [role=alert]")).toContainText("Scores must be between 0 and 20.");
  await teacher.getByLabel("Zoë O'Brien").fill("17");
  await teacher.getByRole("button", { name: "Save marks" }).click();
  await expect(teacher.getByText("Marks saved.")).toBeVisible();
});

test("owner bills the class; a double-clicked payment is recorded once", async () => {
  await owner.goto(`/s/${slug}/fees`);
  const bill = owner.locator("form", { has: owner.getByRole("button", { name: "Create invoices" }) });
  await bill.getByLabel("Description").fill("Spring term");
  await bill.getByLabel("Amount (EUR)").fill("120.50");
  await bill.getByLabel("Due on").fill("2030-01-15");
  await bill.getByRole("button", { name: "Create invoices" }).click();
  await expect(owner.getByText("Created 2 invoice(s).")).toBeVisible();

  await owner.getByLabel("Amount paid for INV-0001").fill("20.50");
  await owner.getByRole("button", { name: "Record" }).first().dblclick();
  await expect(owner.getByText("Payment recorded.")).toBeVisible();
  await owner.reload();
  const row = owner.getByRole("row", { name: /INV-0001/ });
  await expect(row).toContainText("€20.50");
  await expect(row).toContainText("Partly paid");
});

test("parent joins via a linked invite and sees the child's real data", async ({ browser }) => {
  const link = await inviteLink(owner, email("parent"), "parent", "STU-0001 · Zoë O'Brien");
  const parent = await (await browser.newContext()).newPage();
  const check = watchConsole(parent);
  await acceptAs(parent, "Ada Lovelace", email("parent"), link);
  await expect(parent.getByRole("heading", { name: "Your children" })).toBeVisible();
  const card = parent.getByRole("link", { name: /Zoë O'Brien/ });
  await expect(card).toContainText("0%"); // marked absent once
  await expect(card).toContainText("85%"); // 17 / 20
  await expect(card).toContainText("€100.00"); // 120.50 − 20.50
  check();
});

test("an invite link can't be reused", async ({ browser }) => {
  const link = await inviteLink(owner, email("twice"), "teacher");
  const first = await (await browser.newContext()).newPage();
  await acceptAs(first, "First User", email("twice"), link);
  const second = await (await browser.newContext()).newPage();
  await signUp(second, "Second User", email("other"), new URL(link).pathname);
  await second.getByRole("button", { name: "Accept invite" }).click();
  await expect(second.locator("form [role=alert]")).toContainText("invalid, expired, or meant for a different email");
});

test("owner removes a member and their access ends immediately (D-011)", async ({ browser }) => {
  const link = await inviteLink(owner, email("leaver"), "teacher");
  const leaver = await (await browser.newContext()).newPage();
  await acceptAs(leaver, "Leaving Teacher", email("leaver"), link);
  await owner.goto(`/s/${slug}/members`);
  await owner.getByRole("button", { name: "Remove Leaving Teacher" }).click();
  // The row (and its form) disappears — that is the confirmation.
  await expect(owner.getByRole("row", { name: /Leaving Teacher/ })).toHaveCount(0);
  expect((await leaver.goto(`/s/${slug}`))?.status()).toBe(404);
});

test("every change is in the audit log", async () => {
  await owner.goto(`/s/${slug}/audit`);
  for (const action of ["school.create", "class.create", "student.admit", "member.join", "attendance.mark", "marks.enter", "invoice.bill_class", "payment.record", "member.remove"]) {
    await expect(owner.getByRole("cell", { name: action, exact: true }).first()).toBeVisible();
  }
});
