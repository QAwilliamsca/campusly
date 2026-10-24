import { beforeAll, describe, expect, it } from "vitest";
import type { DB } from "@/db/connect";
import { createClass, assignTeacher, listClasses } from "@/lib/services/classes";
import { admitStudent, getStudent, listStudents, updateStudent } from "@/lib/services/students";
import { uploadDocument, listDocuments } from "@/lib/services/documents";
import { addMember, expectCode, makeSchool, testDb } from "./helpers";

let db: DB;
beforeAll(async () => {
  db = await testDb();
});

describe("S-03 classes & students", () => {
  it("codes are sequential per school, and per-school (two schools both start at 0001)", async () => {
    const a = await makeSchool(db);
    const b = await makeSchool(db);
    const s1 = await admitStudent(a, { firstName: "A", lastName: "One" });
    const s2 = await admitStudent(a, { firstName: "B", lastName: "Two" });
    const t1 = await admitStudent(b, { firstName: "C", lastName: "Three" });
    expect([s1.code, s2.code, t1.code]).toEqual(["STU-0001", "STU-0002", "STU-0001"]);
  });

  it("concurrent admissions never share a code", async () => {
    const ctx = await makeSchool(db);
    const rows = await Promise.all(Array.from({ length: 15 }, (_, i) => admitStudent(ctx, { firstName: `K${i}`, lastName: "X" })));
    expect(new Set(rows.map((r) => r.code)).size).toBe(15);
  });

  it("plan limit refuses admission with an upgrade message", async () => {
    const ctx = await makeSchool(db);
    await db.execute(`insert into plan (id, name, limit_kind, limit_value) values ('tiny', 'Tiny', 'students', 2) on conflict do nothing`);
    await db.execute(`update school set plan_id = 'tiny' where id = '${ctx.school.id}'`);
    await admitStudent(ctx, { firstName: "A", lastName: "A" });
    await admitStudent(ctx, { firstName: "B", lastName: "B" });
    await expectCode(admitStudent(ctx, { firstName: "C", lastName: "C" }), "limit");
  });

  it("stores unicode names exactly; rejects empty / over-long / unknown fields", async () => {
    const ctx = await makeSchool(db);
    for (const [f, l] of [["Zoë", "O'Brien"], ["आरव", "शर्मा"], ["Mia 🌟", "D'Souza-Lee"], ["Prince", "."]]) {
      const s = await admitStudent(ctx, { firstName: f!, lastName: l! });
      expect([s.firstName, s.lastName]).toEqual([f, l]);
    }
    await expectCode(admitStudent(ctx, { firstName: "  ", lastName: "X" }), "invalid");
    await expectCode(admitStudent(ctx, { firstName: "A".repeat(101), lastName: "X" }), "invalid");
    await expectCode(admitStudent(ctx, { firstName: "A", lastName: "X", isAdmin: true } as never), "invalid");
  });

  it("class names are unique per school with a friendly error", async () => {
    const ctx = await makeSchool(db);
    await createClass(ctx, { name: "Grade 5-A" });
    await expectCode(createClass(ctx, { name: "Grade 5-A" }), "conflict");
    const other = await makeSchool(db);
    await createClass(other, { name: "Grade 5-A" }); // fine in another school
  });

  it("teachers see only their own classes and students", async () => {
    const ctx = await makeSchool(db);
    const t = await addMember(db, ctx, "teacher");
    const mine = await createClass(ctx, { name: "Mine" });
    const theirs = await createClass(ctx, { name: "Theirs" });
    await assignTeacher(ctx, { classId: mine.id, teacherMembershipId: t.member.id });
    const a = await admitStudent(ctx, { firstName: "In", lastName: "Mine", classId: mine.id });
    const b = await admitStudent(ctx, { firstName: "In", lastName: "Theirs", classId: theirs.id });
    expect((await listClasses(t)).map((c) => c.id)).toEqual([mine.id]);
    expect((await listStudents(t)).map((s) => s.id)).toEqual([a.id]);
    await getStudent(t, a.id);
    await expectCode(getStudent(t, b.id), "not_found");
  });

  it("only a teacher membership can be assigned to a class", async () => {
    const ctx = await makeSchool(db);
    const parent = await addMember(db, ctx, "parent");
    const c = await createClass(ctx, { name: "C" });
    await expectCode(assignTeacher(ctx, { classId: c.id, teacherMembershipId: parent.member.id }), "invalid");
  });

  it("optimistic locking: a stale edit is refused", async () => {
    const ctx = await makeSchool(db);
    const s = await admitStudent(ctx, { firstName: "Old", lastName: "Name" });
    const v2 = await updateStudent(ctx, { id: s.id, version: s.version, firstName: "New", lastName: "Name" });
    expect(v2.version).toBe(2);
    await expectCode(updateStudent(ctx, { id: s.id, version: 1, firstName: "Stale", lastName: "Edit" }), "conflict");
  });
});

describe("S-07 documents", () => {
  const PDF = new TextEncoder().encode("%PDF-1.4 hello");
  const EXE = new Uint8Array([0x4d, 0x5a, 0, 0]);

  it("accepts real PDFs, refuses renamed executables, empty and oversized files", async () => {
    const ctx = await makeSchool(db);
    const s = await admitStudent(ctx, { firstName: "Doc", lastName: "Holder" });
    const d = await uploadDocument(ctx, { studentId: s.id, filename: "../birth.pdf", bytes: PDF });
    expect(d.filename).toBe("birth.pdf");
    expect(d.mime).toBe("application/pdf");
    await expectCode(uploadDocument(ctx, { studentId: s.id, filename: "fake.pdf", bytes: EXE }), "invalid");
    await expectCode(uploadDocument(ctx, { studentId: s.id, filename: "empty.pdf", bytes: new Uint8Array() }), "invalid");
    await expectCode(uploadDocument(ctx, { studentId: s.id, filename: "big.pdf", bytes: new Uint8Array(5 * 1024 * 1024 + 1) }), "invalid");
    const docs = await listDocuments(ctx, s.id);
    expect(docs).toHaveLength(1);
    expect(docs[0]!.url).toMatch(/\/api\/files\/.+\?exp=\d+&sig=/);
  });
});
