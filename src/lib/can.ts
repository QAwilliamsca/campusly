import type { Role } from "@/db/schema";

export type Member = { id: string; userId: string; role: Role; schoolId: string };

export type Action =
  | "school.settings"
  | "member.invite"
  | "member.invite_admin"
  | "member.remove_staff"
  | "class.manage"
  | "student.manage"
  | "student.view"
  | "document.manage"
  | "attendance.mark"
  | "attendance.view"
  | "exam.manage"
  | "reportcard.view"
  | "fee.manage"
  | "fee.view"
  | "audit.view";

/** What a resource is connected to — lets "own" grants be checked. */
export type Resource = { classTeacherId?: string | null; guardianUserIds?: string[]; studentUserId?: string | null };

type Grant = "all" | "own";
const STAFF = { owner: "all", admin: "all" } as const;
const VIEW_OWN = { ...STAFF, teacher: "own", parent: "own", student: "own" } as const;

// docs/PLAN.md "Roles × actions" — keep the two in sync.
const GRANTS: Record<Action, Partial<Record<Role, Grant>>> = {
  "school.settings": STAFF,
  "member.invite": STAFF,
  "member.invite_admin": { owner: "all" },
  "member.remove_staff": { owner: "all" },
  "class.manage": STAFF,
  "student.manage": STAFF,
  "document.manage": STAFF,
  "student.view": VIEW_OWN,
  "attendance.view": VIEW_OWN,
  "reportcard.view": VIEW_OWN,
  "attendance.mark": { ...STAFF, teacher: "own" },
  "exam.manage": { ...STAFF, teacher: "own" },
  "fee.manage": STAFF,
  "fee.view": { ...STAFF, parent: "own", student: "own" },
  "audit.view": STAFF,
};

/**
 * The ONE permission check (PLAYBOOK §10). "own" grants need a resource and
 * fail closed without one. School membership is already guaranteed because the
 * resource was loaded through the member's scoped client.
 */
export function can(member: Member, action: Action, resource?: Resource): boolean {
  const grant = GRANTS[action][member.role];
  if (!grant) return false;
  if (grant === "all") return true;
  if (!resource) return false;
  switch (member.role) {
    case "teacher":
      return !!resource.classTeacherId && resource.classTeacherId === member.id;
    case "parent":
      return resource.guardianUserIds?.includes(member.userId) ?? false;
    case "student":
      return !!resource.studentUserId && resource.studentUserId === member.userId;
    default:
      return false;
  }
}

/** Does this role have any grant for the action? Used for list pages, which then filter rows. */
export const hasAnyGrant = (member: Member, action: Action) => !!GRANTS[action][member.role];

export const isStaff = (member: Member) => member.role === "owner" || member.role === "admin";
