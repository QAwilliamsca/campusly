import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/db/connect";
import { guardian, invitation, membership, school, student, user as userTable } from "@/db/schema";
import { scoped } from "@/db/scoped";
import { audit } from "@/db/audit";
import { userByEmail, usersByIds } from "@/db/global";
import type { Ctx, SessionUser } from "../context";
import { AppError, assertCan, notFound, parse } from "../errors";
import { appUrl, sendMail } from "../mail";
import { email, id } from "../validation";

const INVITE_TTL_DAYS = 7;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

const InviteInput = z
  .object({ email, role: z.enum(["admin", "teacher", "parent", "student"]), studentId: id.optional() })
  .strict()
  .refine((v) => (v.role === "parent" || v.role === "student" ? !!v.studentId : true), { message: "Choose which student this invite is for", path: ["studentId"] });

/** S-02: invite someone by email. Returns the link so staff can share it while mail is dry-run. */
export async function inviteMember(ctx: Ctx, input: unknown) {
  assertCan(ctx.member, "member.invite");
  const data = parse(InviteInput, input);
  if (data.role === "admin") assertCan(ctx.member, "member.invite_admin"); // D-011: only the owner mints admins
  if (data.studentId && !(await ctx.s.findOne(student, eq(student.id, data.studentId)))) throw notFound("Student");

  const existing = await userByEmail(ctx.s, data.email);
  if (existing && (await ctx.s.findOne(membership, eq(membership.userId, existing.id)))) {
    throw new AppError("conflict", "That person is already a member of this school.");
  }

  const token = randomBytes(32).toString("base64url");
  const [inv] = await ctx.s
    .insert(invitation, {
      email: data.email,
      role: data.role,
      studentId: data.studentId ?? null,
      tokenHash: hash(token),
      invitedBy: ctx.user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    })
    .returning();
  const link = `${appUrl()}/invite/${token}`;
  await sendMail(ctx.s._conn, {
    to: data.email,
    template: "invite",
    subject: `You're invited to ${ctx.school.name} on Campusly`,
    text: `${ctx.user.name.slice(0, 100)} invited you to join ${ctx.school.name} as ${data.role}.\n\nAccept: ${link}\n\nThis link expires in ${INVITE_TTL_DAYS} days.`,
  });
  await audit(ctx.s, ctx.user.id, "member.invite", "invitation", inv!.id, { after: { role: data.role, studentId: data.studentId } });
  return { inviteId: inv!.id, link };
}

/** Accept an invite. Single-use, expiring, and bound to the invited email. */
export async function acceptInvite(db: DB, user: SessionUser, token: string) {
  const invalid = new AppError("invalid", "This invite link is invalid, expired, or meant for a different email.");
  const [inv] = await db.select().from(invitation).where(eq(invitation.tokenHash, hash(token))).limit(1);
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt < new Date() || inv.email !== user.email.toLowerCase()) throw invalid;
  // D-010: the email must be proven, or anyone holding the link could sign up as the invitee.
  const [account] = await db.select({ verified: userTable.emailVerified }).from(userTable).where(eq(userTable.id, user.id));
  if (!account?.verified) throw new AppError("invalid", "Verify your email address first, then open the invite link again.");

  return db.transaction(async (tx) => {
    const s = scoped(tx, inv.schoolId);
    // Conditional update = race-safe single use: only one request can flip accepted_at.
    const claimed = await s.update(invitation, { acceptedAt: new Date() }, and(eq(invitation.id, inv.id), isNull(invitation.acceptedAt), isNull(invitation.revokedAt), gt(invitation.expiresAt, new Date()))!);
    if (!claimed.length) throw invalid;
    if (await s.findOne(membership, eq(membership.userId, user.id))) throw new AppError("conflict", "You are already a member of this school.");
    const [m] = await s.insert(membership, { userId: user.id, role: inv.role }).returning();
    if (inv.role === "parent" && inv.studentId) await s.insert(guardian, { studentId: inv.studentId, userId: user.id });
    if (inv.role === "student" && inv.studentId) {
      const linked = await s.update(student, { userId: user.id }, and(eq(student.id, inv.studentId), isNull(student.userId))!);
      if (!linked.length) throw new AppError("conflict", "That student already has a login.");
    }
    await audit(s, user.id, "member.join", "membership", m!.id, { after: { role: inv.role } });
    const [sch] = await tx.select({ slug: school.slug }).from(school).where(eq(school.id, inv.schoolId));
    return { slug: sch!.slug };
  });
}

export async function listMembers(ctx: Ctx) {
  assertCan(ctx.member, "member.invite");
  const rows = await ctx.s.findMany(membership, undefined, { orderBy: [membership.createdAt] });
  const users = await usersByIds(ctx.s, rows.map((r) => r.userId));
  return rows.map((r) => ({ ...r, name: users.get(r.userId)?.name ?? "—", email: users.get(r.userId)?.email ?? "—" }));
}

export async function listInvites(ctx: Ctx) {
  assertCan(ctx.member, "member.invite");
  return ctx.s.findMany(invitation, and(isNull(invitation.acceptedAt), isNull(invitation.revokedAt), gt(invitation.expiresAt, new Date())), {
    orderBy: [invitation.createdAt],
  });
}

export async function revokeInvite(ctx: Ctx, inviteId: string) {
  assertCan(ctx.member, "member.invite");
  const rows = await ctx.s.update(invitation, { revokedAt: new Date() }, and(eq(invitation.id, parse(id, inviteId)), isNull(invitation.acceptedAt))!);
  if (!rows.length) throw notFound("Invite");
  await audit(ctx.s, ctx.user.id, "member.revoke", "invitation", inviteId);
}

/**
 * D-011: remove a member. Access ends on their next request (every request re-loads
 * membership). Owner can't be removed; only the owner removes admins; nobody removes themself.
 */
export async function removeMember(ctx: Ctx, membershipId: string) {
  assertCan(ctx.member, "member.invite");
  const target = await ctx.s.findOne(membership, eq(membership.id, parse(id, membershipId)));
  if (!target) throw notFound("Member");
  if (target.id === ctx.member.id) throw new AppError("invalid", "You can't remove yourself.");
  if (target.role === "owner") throw new AppError("forbidden", "The owner can't be removed.");
  if (target.role === "admin") assertCan(ctx.member, "member.remove_staff");
  await ctx.s.transaction(async (s) => {
    await s.delete(guardian, eq(guardian.userId, target.userId));
    await s.update(student, { userId: null }, eq(student.userId, target.userId));
    await s.delete(membership, eq(membership.id, target.id));
    await audit(s, ctx.user.id, "member.remove", "membership", target.id, { before: { role: target.role } });
  });
}
