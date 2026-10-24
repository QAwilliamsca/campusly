// Maple Grove demo data as the real app shows it on 2026-10-24 (read from the running app, scripts/seed.ts).
export type Student = { code: string; name: string; cls: string; att: number | null; overall: number | null; fees: string; feeTone: string };

export const STUDENTS: Student[] = [
  { code: "STU-0001", name: "Leo Santos", cls: "Grade 5-A", att: 100, overall: 75, fees: "Partly paid", feeTone: "due" },
  { code: "STU-0002", name: "Aisha Khan", cls: "Grade 5-A", att: 90, overall: 91, fees: "Paid", feeTone: "paid" },
  { code: "STU-0003", name: "Mateo García", cls: "Grade 5-A", att: 81, overall: 59, fees: "Paid", feeTone: "paid" },
  { code: "STU-0004", name: "Zoë O'Brien", cls: "Grade 5-A", att: 100, overall: 87, fees: "Unpaid", feeTone: "due" },
  { code: "STU-0005", name: "आरव शर्मा", cls: "Grade 5-A", att: 57, overall: 66, fees: "Unpaid", feeTone: "due" },
  { code: "STU-0006", name: "Yuki Tanaka", cls: "Grade 5-A", att: 100, overall: 93, fees: "Unpaid", feeTone: "due" },
  { code: "STU-0007", name: "Amara Nwosu", cls: "Grade 6-B", att: 100, overall: 79, fees: "Paid", feeTone: "paid" },
  { code: "STU-0008", name: "Noah Fischer", cls: "Grade 6-B", att: 90, overall: 65, fees: "Overdue", feeTone: "over" },
  { code: "STU-0009", name: "Sofia Rossi", cls: "Grade 6-B", att: 80, overall: 89, fees: "Overdue", feeTone: "over" },
  { code: "STU-0010", name: "Ethan Park", cls: "Grade 6-B", att: 100, overall: 76, fees: "Overdue", feeTone: "over" },
  { code: "STU-0011", name: "Mia Santos", cls: "Grade 6-B", att: 60, overall: 59, fees: "Overdue", feeTone: "over" },
  { code: "STU-0012", name: "Kai Müller", cls: "No class", att: null, overall: null, fees: "No invoices", feeTone: "neutral" },
];

export const CLASSES = [
  { name: "Grade 5-A", students: 6, teacher: "Daniel Okafor", today: "Marked", tone: "paid", att: 88 },
  { name: "Grade 6-B", students: 5, teacher: "Samuel Mensah", today: "Not marked", tone: "due", att: 86 },
  { name: "Grade 7-C", students: 0, teacher: null, today: "No students", tone: "neutral", att: null },
];

export const EXAMS = [
  { date: "Sep 29", name: "Unit Test 1", subject: "Maths", cls: "Grade 5-A", max: 50, marked: "6 / 6", avg: "80.3%", tone: "paid", status: "Marked" },
  { date: "Oct 14", name: "Term 1", subject: "Maths", cls: "Grade 5-A", max: 100, marked: "6 / 6", avg: "78.0%", tone: "paid", status: "Marked" },
  { date: "Oct 14", name: "Term 1", subject: "Maths", cls: "Grade 6-B", max: 100, marked: "4 / 5", avg: "72.0%", tone: "due", status: "1 missing" },
  { date: "Oct 15", name: "Term 1", subject: "Science", cls: "Grade 5-A", max: 50, marked: "6 / 6", avg: "75.7%", tone: "paid", status: "Marked" },
  { date: "Oct 16", name: "Term 1", subject: "English", cls: "Grade 5-A", max: 100, marked: "6 / 6", avg: "79.8%", tone: "paid", status: "Marked" },
  { date: "Oct 17", name: "Term 1", subject: "History", cls: "Grade 6-B", max: 50, marked: "5 / 5", avg: "74.4%", tone: "paid", status: "Marked" },
  { date: "Nov 5", name: "Term 2", subject: "Geography", cls: "Grade 6-B", max: 50, marked: "—", avg: "—", tone: "neutral", status: "Upcoming" },
];

export const INVOICES = [
  { code: "INV-0001", student: "Leo Santos", what: "Term 1 tuition", due: "Nov 7", amount: 450, paid: 200, status: "Partly paid", tone: "due" },
  { code: "INV-0002", student: "Aisha Khan", what: "Term 1 tuition", due: "Nov 7", amount: 450, paid: 450, status: "Paid", tone: "paid" },
  { code: "INV-0003", student: "Mateo García", what: "Term 1 tuition", due: "Nov 7", amount: 450, paid: 450, status: "Paid", tone: "paid" },
  { code: "INV-0004", student: "Zoë O'Brien", what: "Term 1 tuition", due: "Nov 7", amount: 450, paid: 0, status: "Unpaid", tone: "due" },
  { code: "INV-0005", student: "आरव शर्मा", what: "Term 1 tuition", due: "Nov 7", amount: 450, paid: 0, status: "Unpaid", tone: "due" },
  { code: "INV-0006", student: "Yuki Tanaka", what: "Term 1 tuition", due: "Nov 7", amount: 450, paid: 0, status: "Unpaid", tone: "due" },
  { code: "INV-0007", student: "Amara Nwosu", what: "Term 1 tuition", due: "Oct 21", amount: 480, paid: 480, status: "Paid", tone: "paid" },
  { code: "INV-0008", student: "Noah Fischer", what: "Term 1 tuition", due: "Oct 21", amount: 480, paid: 0, status: "Overdue", tone: "over" },
  { code: "INV-0009", student: "Sofia Rossi", what: "Term 1 tuition", due: "Oct 21", amount: 480, paid: 0, status: "Overdue", tone: "over" },
  { code: "INV-0010", student: "Ethan Park", what: "Term 1 tuition", due: "Oct 21", amount: 480, paid: 0, status: "Overdue", tone: "over" },
  { code: "INV-0011", student: "Mia Santos", what: "Term 1 tuition", due: "Oct 21", amount: 480, paid: 100, status: "Overdue", tone: "over" },
  { code: "INV-0012", student: "Zoë O'Brien", what: "Science museum trip", due: "Oct 31", amount: 35, paid: 0, status: "Unpaid", tone: "due" },
  { code: "INV-0013", student: "Yuki Tanaka", what: "Lab materials", due: "Oct 19", amount: 20, paid: 20, status: "Paid", tone: "paid" },
];

export const MEMBERS = [
  { name: "Priya Natarajan", email: "principal@example.com", role: "Owner" },
  { name: "Hannah Lee", email: "admin@example.com", role: "Admin" },
  { name: "Daniel Okafor", email: "teacher@example.com", role: "Teacher", note: "Grade 5-A" },
  { name: "Samuel Mensah", email: "teacher2@example.com", role: "Teacher", note: "Grade 6-B" },
  { name: "Olivia Chen", email: "newteacher@example.com", role: "Teacher", note: "No class" },
  { name: "Maria Santos", email: "parent@example.com", role: "Parent", note: "Leo, Mia" },
  { name: "James Khan", email: "parent2@example.com", role: "Parent", note: "Aisha" },
  { name: "Rita Gomez", email: "newparent@example.com", role: "Parent", note: "No child linked" },
  { name: "Leo Santos", email: "student@example.com", role: "Student" },
  { name: "Aisha Khan", email: "student2@example.com", role: "Student" },
];

export const AUDIT = [
  { who: "Hannah Lee", what: "invited a parent", detail: "linked to Sofia Rossi", kind: "mail" },
  { who: "Priya Natarajan", what: "invited a teacher", detail: "new.teacher@example.com", kind: "mail" },
  { who: "Priya Natarajan", what: "uploaded a document", detail: "PDF for Aisha Khan", kind: "file" },
  { who: "Hannah Lee", what: "uploaded a document", detail: "Photo for Leo Santos", kind: "file" },
  { who: "Priya Natarajan", what: "uploaded a document", detail: "PDF for Leo Santos", kind: "file" },
  { who: "Priya Natarajan", what: "recorded a payment", detail: "$20.00 cash · INV-0013", kind: "cash" },
  { who: "Priya Natarajan", what: "created an invoice", detail: "INV-0013 · $20.00", kind: "cash" },
  { who: "Hannah Lee", what: "created an invoice", detail: "INV-0012 · $35.00", kind: "cash" },
  { who: "Priya Natarajan", what: "recorded a payment", detail: "$100.00 cash", kind: "cash" },
  { who: "Hannah Lee", what: "billed a class", detail: "5 invoices × $480.00", kind: "cash" },
  { who: "Priya Natarajan", what: "billed a class", detail: "6 invoices × $450.00", kind: "cash" },
  { who: "Samuel Mensah", what: "created an exam", detail: "Term 2 Geography, Grade 6-B, Nov 5", kind: "doc" },
  { who: "Samuel Mensah", what: "entered marks", detail: "5 students", kind: "doc" },
  { who: "Daniel Okafor", what: "entered marks", detail: "6 students", kind: "doc" },
];

export const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
