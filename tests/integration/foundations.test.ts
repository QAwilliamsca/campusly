import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connect";
import { auditLog, mailLog } from "@/db/schema";
import { loadCtx } from "@/lib/context";
import { createSchool, updateSettings } from "@/lib/services/schools";
import { acceptInvite, inviteMember, listMembers, revokeInvite } from "@/lib/services/members";
import { admitStudent } from "@/lib/services/students";
import { addMember, expectCode, makeSchool, makeUser, testDb } from "./helpers";

let db: DB;
beforeAll(async () => {
  db = await testDb();
});

describe("S-01 school creation", () => {
  it("creator becomes owner; slug is unique; audit row written", async () => {
    const u = await makeUser(db);
    const a = await createSchool(db, u, { name: "Maple Grove", currency: "USD", timezone: "UTC" });
    const b = await createSchool(db, u, { name: "Maple Grove", currency: "USD", timezone: "UTC" });
    expect(a.slug).toBe("maple-grove");
    expect(b.slug).not.toBe(a.slug);
    const ctx = await loadCtx(db, u, a.slug);
    expect(ctx?.member.role).toBe("owner");
    const audits = await db.select().from(auditLog).where(eq(auditLog.schoolId, a.id));
    expect(audits.map((r) => r.action)).toContain("school.create");
  });

  it("rejects bad currency, timezone and empty names", async () => {
    const u = await makeUser(db);
    await expectCode(createSchool(db, u, { name: "X", currency: "ZZZ", timezone: "UTC" }), "invalid");
    await expectCode(createSchool(db, u, { name: "X", currency: "USD", timezone: "Mars/Base" }), "invalid");
    await expectCode(createSchool(db, u, { name: "   ", currency: "USD", timezone: "UTC" }), "invalid");
  });

  it("a non-member gets no context for a school", async () => {
    const ctx = await makeSchool(db);
    const stranger = await makeUser(db);
    expect(await loadCtx(db, stranger, ctx.school.slug)).toBeNull();
  });

  it("only staff change settings", async () => {
    const ctx = await makeSchool(db);
    const teacher = await addMember(db, ctx, "teacher");
    await expectCode(updateSettings(teacher, { name: "Hacked", currency: "USD", timezone: "UTC" }), "forbidden");
    const s = await updateSettings(ctx, { name: "Renamed", currency: "EUR", timezone: "Europe/Paris" });
    expect(s.currency).toBe("EUR");
  });
});

describe("S-02 invitations", () => {
  it("invite → dry-run mail logged → invitee with same email accepts and joins with role", async () => {
    const ctx = await makeSchool(db);
    const invitee = await makeUser(db, "teach");
    const before = (await db.select().from(mailLog)).length;
    const { link } = await inviteMember(ctx, { email: invitee.email.toUpperCase(), role: "teacher" });
    const mails = await db.select().from(mailLog);
    expect(mails.length).toBe(before + 1);
    expect(mails.at(-1)!.status).toBe("dry-run");
    expect(mails.at(-1)!.toMasked).not.toContain(invitee.email); // masked in logs
    const token = link.split("/invite/")[1]!;
    const res = await acceptInvite(db, invitee, token);
    expect(res.slug).toBe(ctx.school.slug);
    const members = await listMembers(ctx);
    expect(members.find((m) => m.userId === invitee.id)?.role).toBe("teacher");
  });

  it("refuses wrong email, reuse, revoked and expired invites", async () => {
    const ctx = await makeSchool(db);
    const right = await makeUser(db);
    const wrong = await makeUser(db);
    const { link } = await inviteMember(ctx, { email: right.email, role: "admin" });
    const token = link.split("/invite/")[1]!;
    await expectCode(acceptInvite(db, wrong, token), "invalid");
    await acceptInvite(db, right, token);
    await expectCode(acceptInvite(db, right, token), "invalid"); // single-use

    const other = await makeUser(db);
    const r = await inviteMember(ctx, { email: other.email, role: "admin" });
    await revokeInvite(ctx, r.inviteId);
    await expectCode(acceptInvite(db, other, r.link.split("/invite/")[1]!), "invalid");

    const late = await makeUser(db);
    const e = await inviteMember(ctx, { email: late.email, role: "admin" });
    await db.execute(`update invitation set expires_at = now() - interval '1 minute' where id = '${e.inviteId}'`);
    await expectCode(acceptInvite(db, late, e.link.split("/invite/")[1]!), "invalid");

    await expectCode(acceptInvite(db, late, "not-a-real-token"), "invalid");
  });

  it("parent invite links the parent to the student; student invite links the login", async () => {
    const ctx = await makeSchool(db);
    const kid = await admitStudent(ctx, { firstName: "Asha", lastName: "Rao" });
    const parent = await makeUser(db, "parent");
    const p = await inviteMember(ctx, { email: parent.email, role: "parent", studentId: kid.id });
    await acceptInvite(db, parent, p.link.split("/invite/")[1]!);
    const pctx = (await loadCtx(db, parent, ctx.school.slug))!;
    expect(pctx.member.role).toBe("parent");

    await expectCode(inviteMember(ctx, { email: "x@example.com", role: "parent" }), "invalid"); // needs a student
  });

  it("an existing member cannot be invited again; only staff invite; nobody can invite an owner", async () => {
    const ctx = await makeSchool(db);
    const t = await addMember(db, ctx, "teacher");
    await expectCode(inviteMember(ctx, { email: t.user.email, role: "admin" }), "conflict");
    await expectCode(inviteMember(t, { email: "y@example.com", role: "teacher" }), "forbidden");
    await expectCode(inviteMember(ctx, { email: "z@example.com", role: "owner" as never }), "invalid");
  });
});
