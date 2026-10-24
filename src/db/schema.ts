import { boolean, date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const schoolId = () => text("school_id").notNull().references(() => school.id, { onDelete: "cascade" });

// ── Better Auth core tables (global, not tenant-scoped) ──────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Global: plans (pricing unit lives in data — the "flip test", D-009) ──────
export const plan = pgTable("plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  limitKind: text("limit_kind", { enum: ["students"] }).notNull(),
  limitValue: integer("limit_value").notNull(),
  storageMb: integer("storage_mb").notNull().default(500), // document storage per school (D-012)
});

// ── The workspace (tenant) ───────────────────────────────────────────────────
export const school = pgTable("school", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  currency: text("currency").notNull(), // ISO 4217, e.g. USD
  timezone: text("timezone").notNull(), // IANA, e.g. Europe/London
  planId: text("plan_id").notNull().references(() => plan.id),
  createdAt: createdAt(),
});

export const ROLES = ["owner", "admin", "teacher", "parent", "student"] as const;
export type Role = (typeof ROLES)[number];

export const membership = pgTable(
  "membership",
  {
    id: id(),
    schoolId: schoolId(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ROLES }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("membership_school_user").on(t.schoolId, t.userId), index("membership_user").on(t.userId)],
);

export const invitation = pgTable(
  "invitation",
  {
    id: id(),
    schoolId: schoolId(),
    email: text("email").notNull(), // stored lower-cased
    role: text("role", { enum: ROLES }).notNull(),
    studentId: text("student_id").references(() => student.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: text("invited_by").notNull().references(() => user.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("invitation_school").on(t.schoolId)],
);

export const schoolClass = pgTable(
  "class",
  {
    id: id(),
    schoolId: schoolId(),
    name: text("name").notNull(),
    teacherMembershipId: text("teacher_membership_id").references(() => membership.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("class_school_name").on(t.schoolId, t.name)],
);

export const student = pgTable(
  "student",
  {
    id: id(),
    schoolId: schoolId(),
    code: text("code").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: date("date_of_birth"),
    classId: text("class_id").references(() => schoolClass.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // the student's own login
    version: integer("version").notNull().default(1), // optimistic locking (§20.2)
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("student_school_code").on(t.schoolId, t.code), index("student_class").on(t.classId)],
);

export const guardian = pgTable(
  "guardian",
  {
    schoolId: schoolId(),
    studentId: text("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.userId] }), index("guardian_school_user").on(t.schoolId, t.userId)],
);

export const ATTENDANCE = ["present", "absent", "late"] as const;

export const attendance = pgTable(
  "attendance",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: text("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    classId: text("class_id").notNull().references(() => schoolClass.id, { onDelete: "cascade" }),
    onDate: date("on_date").notNull(), // the school-local calendar date
    status: text("status", { enum: ATTENDANCE }).notNull(),
    markedBy: text("marked_by").notNull().references(() => user.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("attendance_student_date").on(t.studentId, t.onDate), index("attendance_class_date").on(t.schoolId, t.classId, t.onDate)],
);

export const exam = pgTable(
  "exam",
  {
    id: id(),
    schoolId: schoolId(),
    classId: text("class_id").notNull().references(() => schoolClass.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    maxMarks: integer("max_marks").notNull(),
    heldOn: date("held_on").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("exam_school_class").on(t.schoolId, t.classId)],
);

export const mark = pgTable(
  "mark",
  {
    id: id(),
    schoolId: schoolId(),
    examId: text("exam_id").notNull().references(() => exam.id, { onDelete: "cascade" }),
    studentId: text("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
  },
  (t) => [uniqueIndex("mark_exam_student").on(t.examId, t.studentId), index("mark_school_student").on(t.schoolId, t.studentId)],
);

export const invoice = pgTable(
  "invoice",
  {
    id: id(),
    schoolId: schoolId(),
    code: text("code").notNull(),
    studentId: text("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amountMinor: integer("amount_minor").notNull(), // money = integer minor units, never float
    currency: text("currency").notNull(),
    dueOn: date("due_on").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("invoice_school_code").on(t.schoolId, t.code), index("invoice_student").on(t.studentId)],
);

export const payment = pgTable("payment", {
  id: id(),
  schoolId: schoolId(),
  invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(),
  method: text("method", { enum: ["cash", "bank", "card", "other"] }).notNull(),
  paidOn: date("paid_on").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(), // double-click guard (§20.2)
  recordedBy: text("recorded_by").notNull().references(() => user.id),
  createdAt: createdAt(),
}, (t) => [index("payment_school_invoice").on(t.schoolId, t.invoiceId)]);

export const document = pgTable("document", {
  id: id(),
  schoolId: schoolId(),
  studentId: text("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: createdAt(),
}, (t) => [index("document_school_student").on(t.schoolId, t.studentId)]);

// Human codes (STU-0001): one counter row per school+kind, bumped atomically.
export const counter = pgTable(
  "counter",
  { schoolId: schoolId(), kind: text("kind").notNull(), value: integer("value").notNull() },
  (t) => [primaryKey({ columns: [t.schoolId, t.kind] })],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    schoolId: text("school_id").references(() => school.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_school_at").on(t.schoolId, t.at)],
);

export const mailLog = pgTable("mail_log", {
  id: id(),
  toMasked: text("to_masked").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  body: text("body").notNull(), // dry-run sink: kept so local users can open invite links
  status: text("status", { enum: ["dry-run"] }).notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().default(sql`now()`),
});
