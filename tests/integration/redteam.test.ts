/** Red-team findings (docs/DECISION_JOURNAL.md Entry 6) turned into tests before the fixes. */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connect";
import { mailLog } from "@/db/schema";
import { loadCtx } from "@/lib/context";
import { sendMail } from "@/lib/mail";
import { createSchool, updateSettings } from "@/lib/services/schools";
import { acceptInvite, inviteMember, removeMember } from "@/lib/services/members";
import { admitStudent } from "@/lib/services/students";
import { uploadDocument } from "@/lib/services/documents";
import { createInvoice, recordPayment } from "@/lib/services/fees";
import { addMember, expectCode, makeSchool, makeUser, testDb } from "./helpers";

let db: DB;
beforeAll(async () => {
  db = await testDb();
});

describe("#1 invites need a verified email (D-010)", () => {
  it("an unverified account with the invited email cannot accept", async () => {
    const ctx = await makeSchool(db);
    const squatter = await makeUser(db, "unverified", { verified: false });
    const { link } = await inviteMember(ctx, { email: squatter.email, role: "teacher" });
    await expectCode(acceptInvite(db, squatter, link.split("/invite/")[1]!), "invalid");
  });
});

describe("#2 owner-only admins, and members can be removed (D-011)", () => {
  it("admins cannot invite admins; the owner can", async () => {
    const owner = await makeSchool(db);
    const admin = await addMember(db, owner, "admin");
    await expectCode(inviteMember(admin, { email: "a2@example.com", role: "admin" }), "forbidden");
    await inviteMember(admin, { email: "t2@example.com", role: "teacher" });
    await inviteMember(owner, { email: "a3@example.com", role: "admin" });
  });

  it("removal rules: admins remove non-staff; only the owner removes admins; nobody removes the owner or themself", async () => {
    const owner = await makeSchool(db);
    const admin = await addMember(db, owner, "admin");
    const admin2 = await addMember(db, owner, "admin");
    const teacher = await addMember(db, owner, "teacher");
    await expectCode(removeMember(teacher, admin.member.id), "forbidden");
    await expectCode(removeMember(admin, admin2.member.id), "forbidden");
    await expectCode(removeMember(admin, owner.member.id), "forbidden");
    await expectCode(removeMember(owner, owner.member.id), "invalid");
    await removeMember(admin, teacher.member.id);
    await removeMember(owner, admin2.member.id);
    expect(await loadCtx(db, teacher.user, owner.school.slug)).toBeNull(); // access gone on the next request
    expect(await loadCtx(db, admin2.user, owner.school.slug)).toBeNull();
    const other = await makeSchool(db);
    await expectCode(removeMember(other, admin.member.id), "not_found");
  });
});

describe("#4 limits (D-012)", () => {
  it("an account can own at most 3 schools", async () => {
    const u = await makeUser(db);
    for (let i = 0; i < 3; i++) await createSchool(db, u, { name: `Mine ${i}`, currency: "USD", timezone: "UTC" });
    await expectCode(createSchool(db, u, { name: "Fourth", currency: "USD", timezone: "UTC" }), "limit");
  });

  it("uploads stop at the plan's storage limit", async () => {
    const ctx = await makeSchool(db);
    await db.execute(`insert into plan (id, name, limit_kind, limit_value, storage_mb) values ('onemb', 'One MB', 'students', 50, 1) on conflict do nothing`);
    await db.execute(`update school set plan_id = 'onemb' where id = '${ctx.school.id}'`);
    const s = await admitStudent(ctx, { firstName: "Big", lastName: "Files" });
    const pdf = new Uint8Array(600 * 1024);
    pdf.set(new TextEncoder().encode("%PDF-1.4"));
    await uploadDocument(ctx, { studentId: s.id, filename: "a.pdf", bytes: pdf });
    await expectCode(uploadDocument(ctx, { studentId: s.id, filename: "b.pdf", bytes: pdf }), "limit");
  });
});

describe("#5 the mail log never keeps links unless the local sink is switched on", () => {
  it("redacts bodies when MAIL_SINK is off", async () => {
    const before = process.env.MAIL_SINK;
    delete process.env.MAIL_SINK;
    await sendMail(db, { to: "x@example.com", subject: "S", template: "redact-test", text: "secret link https://x/reset?token=abc" });
    process.env.MAIL_SINK = before;
    const [row] = await db.select().from(mailLog).where(eq(mailLog.template, "redact-test"));
    expect(row!.body).not.toContain("token=abc");
  });
});

describe("#6 currency can't change once money exists", () => {
  it("refuses a currency change after the first invoice; other settings still save", async () => {
    const ctx = await makeSchool(db, { currency: "JPY" });
    await updateSettings(ctx, { name: "Renamed before invoices", currency: "EUR", timezone: "UTC" });
    const fresh = (await loadCtx(db, ctx.user, ctx.school.slug))!;
    const s = await admitStudent(fresh, { firstName: "A", lastName: "B" });
    await createInvoice(fresh, { studentId: s.id, description: "Fee", amount: "10", dueOn: "2026-11-01" });
    await expectCode(updateSettings(fresh, { name: "X", currency: "KWD", timezone: "UTC" }), "conflict");
    await updateSettings(fresh, { name: "Renamed after invoices", currency: "EUR", timezone: "Asia/Tokyo" });
  });
});

describe("#10 #11 payments: key reuse and huge amounts", () => {
  it("reusing an idempotency key on another invoice is refused, not silently ignored", async () => {
    const ctx = await makeSchool(db);
    const s = await admitStudent(ctx, { firstName: "K", lastName: "R" });
    const a = await createInvoice(ctx, { studentId: s.id, description: "A", amount: "10", dueOn: "2026-11-01" });
    const b = await createInvoice(ctx, { studentId: s.id, description: "B", amount: "10", dueOn: "2026-11-01" });
    await recordPayment(ctx, { invoiceId: a.id, amount: "1", method: "cash", idempotencyKey: "reuse-me" });
    await expectCode(recordPayment(ctx, { invoiceId: b.id, amount: "1", method: "cash", idempotencyKey: "reuse-me" }), "conflict");
  });

  it("amounts beyond the storable maximum get a validation message, not a crash", async () => {
    const ctx = await makeSchool(db);
    const s = await admitStudent(ctx, { firstName: "R", lastName: "Ich" });
    await expectCode(createInvoice(ctx, { studentId: s.id, description: "Huge", amount: "999999999.99", dueOn: "2026-11-01" }), "invalid");
  });
});
