import { eq } from "drizzle-orm";
import type { DB } from "@/db/connect";
import { document, student } from "@/db/schema";
import { audit } from "@/db/audit";
import type { Ctx } from "../context";
import { AppError, assertCan, notFound } from "../errors";
import { detectType, getFile, MAX_UPLOAD_BYTES, putFile, safeFilename, signFileUrl, verifyFileUrl } from "../files";

/** S-07: store a student document. Type comes from magic bytes; size checked server-side. */
export async function uploadDocument(ctx: Ctx, input: { studentId: string; filename: string; bytes: Uint8Array }) {
  assertCan(ctx.member, "document.manage");
  if (!(await ctx.s.findOne(student, eq(student.id, input.studentId)))) throw notFound("Student");
  if (input.bytes.length === 0) throw new AppError("invalid", "The file is empty.");
  if (input.bytes.length > MAX_UPLOAD_BYTES) throw new AppError("invalid", "Files must be 5 MB or smaller.");
  const mime = detectType(input.bytes);
  if (!mime) throw new AppError("invalid", "Only PDF, PNG and JPG files are allowed.");

  const storageKey = `${ctx.school.id}/${crypto.randomUUID()}`;
  await putFile(storageKey, input.bytes);
  const [row] = await ctx.s
    .insert(document, { studentId: input.studentId, filename: safeFilename(input.filename), mime, size: input.bytes.length, storageKey })
    .returning();
  await audit(ctx.s, ctx.user.id, "document.upload", "document", row!.id, { after: { studentId: input.studentId, mime, size: row!.size } });
  return row!;
}

export async function listDocuments(ctx: Ctx, studentId: string) {
  assertCan(ctx.member, "document.manage");
  if (!(await ctx.s.findOne(student, eq(student.id, studentId)))) throw notFound("Student");
  const rows = await ctx.s.findMany(document, eq(document.studentId, studentId), { orderBy: [document.createdAt] });
  return rows.map((d) => {
    const { exp, sig } = signFileUrl(d.id, ctx.school.id);
    return { ...d, url: `/api/files/${d.id}?exp=${exp}&sig=${sig}` };
  });
}

/** Serve a file from a signed URL. The signature binds doc + school + expiry. */
export async function readDocument(db: DB, docId: string, exp: number, sig: string) {
  const [d] = await db.select().from(document).where(eq(document.id, docId)).limit(1);
  if (!d || !verifyFileUrl(d.id, d.schoolId, exp, sig)) return null;
  return { doc: d, bytes: await getFile(d.storageKey) };
}
