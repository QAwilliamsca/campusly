import { describe, expect, it } from "vitest";
import { can, type Member } from "@/lib/can";

const m = (role: Member["role"], id = "m1", userId = "u1"): Member => ({ id, userId, role, schoolId: "s1" });

describe("can() — the single permission function (PLAYBOOK §10)", () => {
  it("owner and admin can manage everything", () => {
    for (const r of ["owner", "admin"] as const) {
      expect(can(m(r), "student.manage")).toBe(true);
      expect(can(m(r), "fee.manage")).toBe(true);
      expect(can(m(r), "audit.view")).toBe(true);
    }
  });

  it("teacher can mark attendance only for a class they teach", () => {
    const t = m("teacher", "t1");
    expect(can(t, "attendance.mark", { classTeacherId: "t1" })).toBe(true);
    expect(can(t, "attendance.mark", { classTeacherId: "t2" })).toBe(false);
    expect(can(t, "attendance.mark", { classTeacherId: null })).toBe(false);
  });

  it("'own' grants are refused when no resource is given (fail closed)", () => {
    expect(can(m("teacher"), "attendance.mark")).toBe(false);
    expect(can(m("parent"), "reportcard.view")).toBe(false);
  });

  it("parent sees only their own children", () => {
    const p = m("parent", "p1", "parentUser");
    expect(can(p, "reportcard.view", { guardianUserIds: ["parentUser"] })).toBe(true);
    expect(can(p, "reportcard.view", { guardianUserIds: ["someoneElse"] })).toBe(false);
    expect(can(p, "fee.view", { guardianUserIds: ["parentUser"] })).toBe(true);
  });

  it("student sees only themselves", () => {
    const s = m("student", "s1", "stuUser");
    expect(can(s, "reportcard.view", { studentUserId: "stuUser" })).toBe(true);
    expect(can(s, "reportcard.view", { studentUserId: "other" })).toBe(false);
  });

  it("lower roles can never manage", () => {
    for (const r of ["teacher", "parent", "student"] as const) {
      expect(can(m(r), "student.manage")).toBe(false);
      expect(can(m(r), "member.invite")).toBe(false);
      expect(can(m(r), "fee.manage")).toBe(false);
      expect(can(m(r), "school.settings")).toBe(false);
    }
  });

  it("teachers cannot see fees at all", () => {
    expect(can(m("teacher", "t1"), "fee.view", { classTeacherId: "t1" })).toBe(false);
  });
});
