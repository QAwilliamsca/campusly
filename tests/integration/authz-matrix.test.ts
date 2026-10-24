/**
 * Authorization matrix (PLAYBOOK §15): for every resource × action, a user from
 * another school and every lower role must be refused. If someone removes a
 * visibility filter or a can() check, a row here goes red.
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { DB } from "@/db/connect";
import type { Ctx } from "@/lib/context";
import { assignTeacher, createClass, listClasses } from "@/lib/services/classes";
import { admitStudent, getStudent, listStudents, updateStudent } from "@/lib/services/students";
import { classAttendance, markAttendance } from "@/lib/services/attendance";
import { createExam, enterMarks, reportCard } from "@/lib/services/exams";
import { createInvoice, listInvoices, recordPayment } from "@/lib/services/fees";
import { inviteMember, listMembers } from "@/lib/services/members";
import { updateSettings } from "@/lib/services/schools";
import { listAudit } from "@/lib/services/audit";
import { listDocuments, uploadDocument } from "@/lib/services/documents";
import { addMember, makeSchool, testDb } from "./helpers";

let db: DB;
let A: Awaited<ReturnType<typeof world>>;
let otherSchoolOwner: Ctx;
const PDF = new TextEncoder().encode("%PDF-1.4");

async function world() {
  const owner = await makeSchool(db);
  const teacher = await addMember(db, owner, "teacher");
  const otherTeacher = await addMember(db, owner, "teacher");
  const parent = await addMember(db, owner, "parent");
  const studentUser = await addMember(db, owner, "student");
  const cls = await createClass(owner, { name: "Matrix" });
  await assignTeacher(owner, { classId: cls.id, teacherMembershipId: teacher.member.id });
  const kid = await admitStudent(owner, { firstName: "Kid", lastName: "A", classId: cls.id });
  const exam = await createExam(owner, { classId: cls.id, name: "T", subject: "S", maxMarks: 10, heldOn: "2026-10-01" });
  const inv = await createInvoice(owner, { studentId: kid.id, description: "Fee", amount: "10", dueOn: "2026-11-01" });
  return { owner, teacher, otherTeacher, parent, studentUser, cls, kid, exam, inv };
}

beforeAll(async () => {
  db = await testDb();
  A = await world();
  otherSchoolOwner = await makeSchool(db);
});

type Op = { name: string; run: (c: Ctx) => Promise<unknown>; refused: (keyof typeof roles)[] };
const roles = {
  otherSchool: () => otherSchoolOwner,
  otherTeacher: () => A.otherTeacher,
  teacher: () => A.teacher,
  parent: () => A.parent, // not linked to the kid
  student: () => A.studentUser, // not the kid
};
const ALL = Object.keys(roles) as (keyof typeof roles)[];
const NON_STAFF = ALL;
const k = (n: number) => `matrix-${n}-${Math.random()}`;

const ops: Op[] = [
  { name: "student.view", run: (c) => getStudent(c, A.kid.id), refused: ["otherSchool", "otherTeacher", "parent", "student"] },
  { name: "student.update", run: (c) => updateStudent(c, { id: A.kid.id, version: 1, firstName: "X", lastName: "Y" }), refused: NON_STAFF },
  { name: "student.admit", run: (c) => admitStudent(c, { firstName: "X", lastName: "Y" }), refused: NON_STAFF.filter((r) => r !== "otherSchool") },
  { name: "attendance.mark", run: (c) => markAttendance(c, { classId: A.cls.id, entries: [{ studentId: A.kid.id, status: "present" }] }), refused: ["otherSchool", "otherTeacher", "parent", "student"] },
  { name: "attendance.classView", run: (c) => classAttendance(c, { classId: A.cls.id, date: "2026-10-01" }), refused: ["otherSchool", "otherTeacher", "parent", "student"] },
  { name: "exam.create", run: (c) => createExam(c, { classId: A.cls.id, name: "N", subject: "S", maxMarks: 5, heldOn: "2026-10-01" }), refused: ["otherSchool", "otherTeacher", "parent", "student"] },
  { name: "mark.enter", run: (c) => enterMarks(c, { examId: A.exam.id, entries: [{ studentId: A.kid.id, score: 5 }] }), refused: ["otherSchool", "otherTeacher", "parent", "student"] },
  { name: "reportcard.view", run: (c) => reportCard(c, A.kid.id), refused: ["otherSchool", "otherTeacher", "parent", "student"] },
  { name: "fee.create", run: (c) => createInvoice(c, { studentId: A.kid.id, description: "X", amount: "1", dueOn: "2026-11-01" }), refused: NON_STAFF },
  { name: "fee.pay", run: (c) => recordPayment(c, { invoiceId: A.inv.id, amount: "1", method: "cash", idempotencyKey: k(1) }), refused: NON_STAFF },
  { name: "member.invite", run: (c) => inviteMember(c, { email: `m${Math.random()}@example.com`, role: "teacher" }), refused: NON_STAFF.filter((r) => r !== "otherSchool") },
  { name: "member.list", run: (c) => listMembers(c), refused: ["otherTeacher", "teacher", "parent", "student"] },
  { name: "settings.update", run: (c) => updateSettings(c, { name: "X", currency: "USD", timezone: "UTC" }), refused: ["otherTeacher", "teacher", "parent", "student"] },
  { name: "audit.view", run: (c) => listAudit(c), refused: ["otherTeacher", "teacher", "parent", "student"] },
  { name: "document.upload", run: (c) => uploadDocument(c, { studentId: A.kid.id, filename: "a.pdf", bytes: PDF }), refused: NON_STAFF },
  { name: "document.list", run: (c) => listDocuments(c, A.kid.id), refused: NON_STAFF },
];

describe("authorization matrix", () => {
  for (const op of ops) {
    for (const who of op.refused) {
      it(`${op.name} refused for ${who}`, async () => {
        const err = await op.run(roles[who]()).then(() => null, (e: { code?: string }) => e);
        expect(err?.code, `${op.name} as ${who} should be refused`).toMatch(/^(forbidden|not_found)$/);
      });
    }
  }

  it("lists never leak across schools or roles", async () => {
    expect((await listStudents(otherSchoolOwner)).map((s) => s.id)).not.toContain(A.kid.id);
    expect(await listClasses(A.otherTeacher)).toEqual([]);
    expect(await listStudents(A.otherTeacher)).toEqual([]);
    expect(await listStudents(A.parent)).toEqual([]);
    expect(await listStudents(A.studentUser)).toEqual([]);
    expect(await listInvoices(A.parent)).toEqual([]);
    expect((await listInvoices(otherSchoolOwner)).map((i) => i.id)).not.toContain(A.inv.id);
  });

  it("the allowed roles still succeed (the matrix isn't trivially refusing everything)", async () => {
    await getStudent(A.teacher, A.kid.id);
    await reportCard(A.teacher, A.kid.id);
    await markAttendance(A.teacher, { classId: A.cls.id, entries: [{ studentId: A.kid.id, status: "present" }] });
    await recordPayment(A.owner, { invoiceId: A.inv.id, amount: "1", method: "cash", idempotencyKey: k(2) });
  });
});
