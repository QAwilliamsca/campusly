import { beforeAll, describe, expect, it } from "vitest";
import type { DB } from "@/db/connect";
import { assignTeacher, createClass } from "@/lib/services/classes";
import { admitStudent } from "@/lib/services/students";
import { attendanceSummary, classAttendance, markAttendance } from "@/lib/services/attendance";
import { addMember, expectCode, makeSchool, testDb } from "./helpers";

let db: DB;
beforeAll(async () => {
  db = await testDb();
});

async function setup() {
  const ctx = await makeSchool(db, { timezone: "America/New_York" });
  const t = await addMember(db, ctx, "teacher");
  const c = await createClass(ctx, { name: "5-A" });
  await assignTeacher(ctx, { classId: c.id, teacherMembershipId: t.member.id });
  const a = await admitStudent(ctx, { firstName: "A", lastName: "A", classId: c.id });
  const b = await admitStudent(ctx, { firstName: "B", lastName: "B", classId: c.id });
  return { ctx, t, c, a, b };
}

describe("S-04 attendance", () => {
  it("teacher marks own class; saving twice updates, never duplicates", async () => {
    const { t, c, a, b } = await setup();
    const date = "2026-10-20";
    await markAttendance(t, { classId: c.id, date, entries: [{ studentId: a.id, status: "present" }, { studentId: b.id, status: "absent" }] });
    await markAttendance(t, { classId: c.id, date, entries: [{ studentId: a.id, status: "late" }, { studentId: b.id, status: "absent" }] });
    const rows = await classAttendance(t, { classId: c.id, date });
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.studentId === a.id)?.status).toBe("late");
  });

  it("refuses a class the teacher doesn't teach, and students not in the class", async () => {
    const { ctx, t, a } = await setup();
    const other = await createClass(ctx, { name: "Other" });
    const outsider = await admitStudent(ctx, { firstName: "O", lastName: "O", classId: other.id });
    await expectCode(markAttendance(t, { classId: other.id, entries: [{ studentId: outsider.id, status: "present" }] }), "forbidden");
    const mine = (await setup()).c; // a class in a different school
    await expectCode(markAttendance(t, { classId: mine.id, entries: [{ studentId: a.id, status: "present" }] }), "not_found");
  });

  it("rejects future dates and junk statuses", async () => {
    const { t, c, a } = await setup();
    await expectCode(markAttendance(t, { classId: c.id, date: "2999-01-01", entries: [{ studentId: a.id, status: "present" }] }), "invalid");
    await expectCode(markAttendance(t, { classId: c.id, entries: [{ studentId: a.id, status: "sleeping" as never }] }), "invalid");
  });

  it("summary: (present + late) / marked, and '—' (null) with no data", async () => {
    const { t, c, a, b } = await setup();
    expect((await attendanceSummary(t, b.id)).percent).toBeNull();
    for (const [date, status] of [["2026-10-01", "present"], ["2026-10-02", "late"], ["2026-10-03", "absent"]] as const) {
      await markAttendance(t, { classId: c.id, date, entries: [{ studentId: a.id, status }] });
    }
    const s = await attendanceSummary(t, a.id);
    expect(s).toMatchObject({ present: 1, late: 1, absent: 1, marked: 3, percent: 67 });
  });
});
