// Builds docs/Campusly-Live-Session-Idea-to-Live.docx — the student guided document.
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, HeadingLevel, ImageRun, PageBreak, Header, Footer, PageNumber, LevelFormat, TableLayoutType,
} = require("docx");

const ROOT = process.env.PROJECT;
const IMG = ROOT + "/docs/guide-img/";
const DEP = ROOT + "/docs/deploy/img/";
const OUT = ROOT + "/docs/Campusly-Live-Session-Idea-to-Live.docx";

// Evergreen brand (D-013)
const ACCENT = "0B6E5F", ACCENT_SOFT = "E3F3EF", INK = "16201C", MUTED = "55635C", GREY = "F1F3F0", WARN = "FCF0DC", WARN_INK = "8D4A06", BORDER = "DBE3DA";
const W = 9026; // A4 content width in DXA (1" margins)
const FONT = "Arial", MONO = "Courier New";
const TR = (o) => new TextRun(typeof o === "string" ? { text: o, font: FONT } : { font: FONT, ...o });

// ── inline formatting: **bold**, `code` ───────────────────────────────────────
function runs(text, base = {}) {
  const out = [];
  for (const part of String(text).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g)) {
    if (!part) continue;
    if (part.startsWith("**")) out.push(TR({ ...base, text: part.slice(2, -2), bold: true }));
    else if (part.startsWith("*") && part.length > 2) out.push(TR({ ...base, text: part.slice(1, -1), italics: true }));
    else if (part.startsWith("`")) out.push(TR({ ...base, text: part.slice(1, -1), font: MONO, size: (base.size || 21) - 2 }));
    else out.push(TR({ ...base, text: part }));
  }
  return out;
}
const p = (text, o = {}) => new Paragraph({ children: runs(text, o.run || {}), spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 }, alignment: o.align, keepNext: o.keepNext });
const h1 = (text, br = false) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [TR(text)], pageBreakBefore: br });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [TR(text)] });
const label = (text, color = ACCENT) => new Paragraph({ children: [TR({ text, bold: true, color, size: 18, characterSpacing: 20 })], spacing: { before: 200, after: 60 }, keepNext: true });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

let listCounter = 0;
const bullets = (items) => items.map((t) => new Paragraph({ children: runs(t), numbering: { reference: "bullets", level: 0 }, spacing: { after: 60, line: 264 } }));
const steps = (items) => {
  const ref = `steps${++listCounter}`;
  return items.map((t) => new Paragraph({ children: runs(t), numbering: { reference: ref, level: 0 }, spacing: { after: 70, line: 264 } }));
};

// ── tables ────────────────────────────────────────────────────────────────────
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, left: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, right: { style: BorderStyle.SINGLE, size: 4, color: BORDER } };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } };
function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((c) =>
    c instanceof Paragraph ? c : new Paragraph({ children: runs(c, { size: o.size || 19, bold: o.bold, color: o.color, italics: o.italics, font: o.font }), spacing: { after: 40, line: 252 } }),
  );
  return new TableCell({
    children: paras,
    width: { size: width, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: o.borders || cellBorders,
    columnSpan: o.span,
  });
}
function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const head = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { fill: ACCENT, color: "FFFFFF", bold: true, size: 18 })) });
  const body = rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? "FAFBF9" : undefined })) }));
  return [new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: [head, ...body] }), p("", { after: 80 })];
}

// PROMPT box: five lines + what was actually typed
function prompt(n, title, five, typed, typedNote) {
  const L = 1500, R = W - L;
  const rows = [
    new TableRow({ children: [cell(`PROMPT ${n}`, L, { fill: ACCENT, color: "FFFFFF", bold: true }), cell(title, R, { fill: ACCENT, color: "FFFFFF", bold: true })] }),
    ...["Context", "Goal", "Rules", "Constraints", "Proof"].map((k) => new TableRow({ cantSplit: true, children: [cell(k, L, { fill: ACCENT_SOFT, bold: true }), cell(five[k], R)] })),
    new TableRow({ children: [cell("", L, { fill: ACCENT_SOFT }), cell("**Plan first.**", R)] }),
  ];
  const out = [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [L, R], layout: TableLayoutType.FIXED, rows })];
  if (typed) {
    out.push(label(typedNote || "WHAT WAS ACTUALLY TYPED IN THIS BUILD", MUTED));
    out.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [cell(typed, W, { fill: GREY, italics: true, size: 19 })] })] }));
  }
  out.push(p("", { after: 60 }));
  return out;
}
// The three-row decision box from the reference style
function decide(question, signal, different) {
  const L = 2100, R = W - L;
  const rows = [
    new TableRow({ children: [cell("HOW YOU DECIDE THIS YOURSELF", W, { fill: WARN, color: WARN_INK, bold: true, span: 2 })] }),
    new TableRow({ children: [cell("The question", L, { bold: true }), cell(question, R)] }),
    new TableRow({ children: [cell("The signal", L, { bold: true }), cell(signal, R)] }),
    new TableRow({ children: [cell("If the answer is different", L, { bold: true }), cell(different, R)] }),
  ];
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [L, R], layout: TableLayoutType.FIXED, rows }), p("", { after: 120 })];
}
function audit(text) {
  const b = { ...noBorders, left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT } };
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [cell([new Paragraph({ children: [TR({ text: "AUDIT CHECK  ", bold: true, color: ACCENT, size: 19 }), ...runs(text, { size: 19 })], spacing: { after: 20, line: 252 } })], W, { fill: "F6F8F5", borders: b })] })] }), p("", { after: 120 })];
}
function note(title, text, fill = WARN, color = WARN_INK) {
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [cell([new Paragraph({ children: [TR({ text: title + "  ", bold: true, color, size: 19 }), ...runs(text, { size: 19 })], spacing: { after: 20, line: 252 } })], W, { fill, borders: noBorders })] })] }), p("", { after: 120 })];
}
function code(lines) {
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [cell(lines.map((l) => new Paragraph({ children: [TR({ text: l || " ", font: MONO, size: 17 })], spacing: { after: 0, line: 240 } })), W, { fill: GREY, borders: noBorders })] })] }), p("", { after: 100 })];
}

// ── images (reads PNG/JPEG size from the file header) ─────────────────────────
function imgSize(buf) {
  if (buf[0] === 0x89) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  throw new Error("unknown image");
}
function img(file, caption, maxWIn = 6.27, maxHIn = 7.6) {
  const data = fs.readFileSync(file);
  const { w, h } = imgSize(data);
  let width = maxWIn * 96, height = (width * h) / w;
  if (height > maxHIn * 96) { height = maxHIn * 96; width = (height * w) / h; }
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 }, keepNext: true, children: [new ImageRun({ type: file.endsWith(".png") ? "png" : "jpg", data, transformation: { width: Math.round(width), height: Math.round(height) }, altText: { title: caption, description: caption, name: caption } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [TR({ text: caption, italics: true, color: MUTED, size: 17 })] }),
  ];
}
function stage(no, kicker, title, atEnd) {
  return [
    new Paragraph({ pageBreakBefore: true, children: [TR({ text: `STAGE ${no} · ${kicker}`, bold: true, color: ACCENT, size: 18, characterSpacing: 20 })], spacing: { after: 40 } }),
    h1(title),
    new Paragraph({ children: [TR({ text: "At the end: ", bold: true }), ...runs(atEnd)], spacing: { after: 160, line: 276 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER, space: 6 } } }),
  ];
}
const live = (text) => new Paragraph({ children: [TR({ text: "LIVE  ", bold: true, color: "FFFFFF", shading: { type: ShadingType.CLEAR, color: "auto", fill: ACCENT }, size: 17 }), TR({ text: " " }), ...runs(text)], spacing: { after: 100, line: 276 } });
const see = (text) => new Paragraph({ children: [TR({ text: "What you should see  ", bold: true, color: ACCENT }), ...runs(text)], spacing: { before: 60, after: 120, line: 276 } });

// ══════════════════════════════════════════════════════════════════════════════
const C = [];
const add = (...xs) => xs.flat().forEach((x) => C.push(x));

// ── Cover ─────────────────────────────────────────────────────────────────────
add(
  new Paragraph({ children: [TR({ text: "AI Operator · Live Session · [Hands On] · Work along with this", bold: true, color: ACCENT, size: 18, characterSpacing: 20 })], spacing: { after: 120 } }),
  new Paragraph({ heading: HeadingLevel.TITLE, children: [TR("Idea to Live: Building Campusly, a School Management SaaS, with Claude Code and the Playbook")] }),
  p("From one vague sentence to a tested multi-school app, a student-ready GitHub repository and a server on AWS, with every decision explained so you can make it yourself next time.", { run: { size: 24, color: MUTED }, after: 240 }),
  label("THE PROBLEM"),
  p("Everyone can get Claude Code to produce a screen. Almost nobody can take a vague idea through requirements, decisions, design, build, testing, a security review and deployment without the result falling apart at the first real user, or without the AI quietly guessing the things the buyer cares about most."),
  label("HOW WE SOLVE IT"),
  p("We start from one sentence, *build a school management system*, and run it through **PLAYBOOK.md**, an operating manual for an AI agent. The playbook makes Claude ask before it guesses, write tests before code, keep the founder in charge of every customer-visible decision, and prove every claim with a number. Every stage below shows the prompt, what Claude asked, what was built, how it was checked, and how you make the same decision on your own idea."),
  label("WHAT YOU WILL HAVE AT THE END"),
  p("**Campusly**, a multi-school web app (students and classes, attendance, exams and report cards, fees) where five roles each see only their own data, guarded by **155 automated tests**. You also get a **decision journal** of every question the founder answered, a **GitHub repository** you can clone and extend, an **AWS server** ready to go live, and a method you can run on any idea."),
  ...img(IMG + "s01-landing.png", "Campusly: the public home page in the Evergreen brand (Stage 3)", 6.0),
);

// ── 0. How this session runs ──────────────────────────────────────────────────
add(
  h1("0. How this session runs", true),
  p("Campusly was built **before** the session, stage by stage. In the session we walk through it in order: the instructor shows each stage on screen (**LIVE**), and you repeat the same prompts on your own idea afterwards (**PRACTICE**). The second half of the session builds new features together; that part is added to this guide afterwards."),
  ...table(
    ["#", "Stage", "What happens", "Time", "Playbook"],
    [
      ["1", "Research", "One vague sentence becomes a one-page spec after a short interview", "0:00–0:10", "§6 (Stage 1)"],
      ["2", "Decide & lock", "Decision table, a hard cut line, user stories that become tests", "0:10–0:20", "§7 (Stage 2)"],
      ["3", "Brand", "Name and design tokens; four kits shown as real screens; a theme toggle", "0:20–0:30", "§8 (Stage 3)"],
      ["4", "Architecture", "A boring stack that runs with zero installs; lint and CI from commit 1", "0:30–0:35", "§9 (Stage 4)"],
      ["5", "Foundations", "Tenancy wall, one permission check, codes, audit, mail, files: tests first", "0:35–0:50", "§10 (Stage 5)"],
      ["6", "Feature slices", "Students, attendance, exams, fees: every screen, every role", "0:50–1:05", "§11 (Stage 6)"],
      ["7", "Quality", "155 tests, the sabotage demo, a red-team review by a second agent", "1:05–1:20", "§15 (Stage 10)"],
      ["8", "Demo data", "An account for every role and every empty state", "1:20–1:25", "§11 Demo data"],
      ["9", "Student-ready repo", "PLAYBOOK.md, CLAUDE.md, GitHub, one-command setup", "1:25–1:35", "§4, §9"],
      ["10", "Deploy (in progress)", "AWS account, budget alarm, read-only token, Lightsail server", "1:35–1:55", "§16 (Stage 11)"],
    ],
    [500, 1700, 4026, 1300, 1500],
  ),
  h2("Before the session (instructor, once)"),
  ...table(
    ["You need", "Detail"],
    [
      ["The repository", "github.com/shivavashishtha/campusly (private). Add students as collaborators, or have them fork it."],
      ["On each student's machine", "Node.js 22+ (from nodejs.org) and Claude Code. Nothing else: the database is embedded, so no Docker."],
      ["The app running locally", "`pnpm install`, then `pnpm dev`. It seeds the demo schools and opens http://localhost:3000."],
      ["Demo sign-ins", "principal@ / teacher@ / parent@ / student@example.com: password `campusly-demo-1` (fictional people)."],
      ["Accounts (instructor only)", "AWS (with the $25 budget alarm) and GitHub. Students do not need AWS accounts."],
      ["A rehearsal", "Run the sabotage demo in Stage 7 once beforehand; it is the moment students remember."],
    ],
    [2600, 6426],
  ),
  h2("The prompt formula (every prompt in this guide, and every prompt you write after it)"),
  p("A prompt is a brief, not a wish. Every prompt below is built from the same five lines, in this order, and ends with **Plan first**:"),
  ...table(
    ["Line", "What it says", "Example"],
    [
      ["Context", "What this is and where we are", "Campusly; Stage 6, the fees module"],
      ["Goal", "The one result, stated as something you can see", "Bill a whole class; record payments; show paid / partly paid / overdue"],
      ["Rules", "The must-never-happen rules that apply", "No double payment; money never stored as a float"],
      ["Constraints", "What not to do", "No payment gateway; brand tokens only"],
      ["Proof", "How we will know it worked", "A double-clicked payment is recorded once, shown by a test"],
    ],
    [1500, 3300, 4226],
  ),
  ...note("THE TWIST IN THIS BUILD", "The founder typed short, natural sentences on purpose, the way most people talk to an AI. Under each PROMPT you will see **what was actually typed** next to **the five-line version**. Compare them: every question Claude asked during the build was one of the missing lines. That is the skill this session teaches."),
);

// ── 1. Concept ────────────────────────────────────────────────────────────────
add(
  h1("1. The concept: one playbook, run once, on one product", true),
  p("**PLAYBOOK.md** (in the repository) organises a whole product build into 14 stages in five tracks. In this build we ran Stages 1–6 and 10 fully and started Stage 11. The rest are written down as a **cut line**, so nothing is forgotten."),
  ...table(
    ["Track", "Stages", "In this build"],
    [
      ["Discover", "1 Research · 2 Decide & lock", "Done"],
      ["Design the base", "3 Brand · 4 Architecture · 5 Foundations", "Done"],
      ["Build", "6 Vertical slices · 7 AI layer · 8 Integrations", "6 done; 7–8 below the cut line"],
      ["Harden", "9 Admin · 10 Quality · 11 Deploy & operate", "10 done; 11 in progress; 9 below the cut line"],
      ["Sell & scale", "12 Marketing · 13 First customers · 14 Scale & cost", "Below the cut line"],
    ],
    [2000, 4226, 2800],
  ),
  p("Three ideas carry the whole session:"),
  ...bullets([
    "**The founder decides; the agent proposes.** Anything a school, parent or student could notice belongs to the human (§1.1). Claude asks one question at a time, always with options and one recommendation. Purely technical choices are Claude's, and it writes them down.",
    "**Tests before code, rules before features.** We first wrote down what must never happen (a parent seeing someone else's child, a payment recorded twice), then wrote a test that fails if it happens, and only then built the feature.",
    "**Done means verified, with a number.** No step is announced as working until there is evidence: a test count, a screenshot, a figure that reconciles. When something is cut, it is named, never silently dropped (§2.5, §2.7).",
  ]),
);

// ── 2. Product ────────────────────────────────────────────────────────────────
add(
  h1("2. The product we build: Campusly"),
  p("**Who pays:** schools that run admissions, attendance, marks and fees on paper, spreadsheets and chat groups. Campusly is sold to **many schools**; each school is an isolated workspace."),
  p("**What they lose today:** records disagree, parents find out late, report cards need spreadsheet work, fee follow-up is manual. **What success looks like:** a teacher marks a class in under a minute; a parent sees today's attendance the same day; a report card needs zero spreadsheet work."),
  p("**The job, in one sentence:** give every school one place where admins, teachers, parents and students see the same, correct record of each student's attendance, marks and fees."),
  h2("The six things that must never happen"),
  ...steps([
    "A user from School A sees any record of School B.",
    "A parent sees a child who isn't theirs; a student sees another student's marks.",
    "A teacher edits attendance or marks for a class they don't teach.",
    "An email reaches a real person from a test environment.",
    "A payment is recorded twice from a double click.",
    "Money is stored or added up as a decimal (floating-point) number.",
  ]),
  h2("Who logs in, and what they see"),
  ...table(
    ["Role", "Sees", "Can change"],
    [
      ["Owner (principal)", "Everything in their school", "Everything; only the owner can invite admins"],
      ["Admin", "Everything in their school", "Everything except inviting admins or removing the owner/admins"],
      ["Teacher", "Only the classes they teach", "Attendance and marks for those classes"],
      ["Parent", "Only their own children", "Nothing: read-only"],
      ["Student", "Only themself", "Nothing: read-only"],
    ],
    [1900, 3300, 3826],
  ),
  ...img(IMG + "s04-school-picker.png", "After sign-in: the school picker. Priya owns Maple Grove and is an admin at Riverside.", 6.0),
);

// ── STAGE 1 ───────────────────────────────────────────────────────────────────
add(
  stage(1, "PLAYBOOK §6 · 0:00–0:10", "Research: the vague idea becomes one page", "`docs/research/SPEC.md` with the customer and the job in one sentence each, the top must-haves, the six must-never-happen lines and the non-functional requirements; plus `docs/DECISION_JOURNAL.md`, which logs every question asked."),
  live("Open Claude Code in an empty folder, put PLAYBOOK.md in it, and type the first prompt."),
  prompt(1, "Turn the idea into a spec", {
    Context: "A new product; nothing exists. PLAYBOOK.md in this folder is the operating manual.",
    Goal: "`docs/research/SPEC.md`: who the customer is and the job they hire us for (one sentence each), the top 3–4 must-haves, what must never happen, and the basic non-functional requirements.",
    Rules: "Playbook §6: interview the founder one question at a time; scope, segment and locale are the founder's decisions (§1.1).",
    Constraints: "No code yet. Check the machine yourself before asking (installed tools are facts, not questions). The must-never list has at most six lines.",
    Proof: "I can read the customer and job sentences aloud and agree; the must-never list has six or fewer lines.",
  }, "So I am an AI trainer… I'm sharing a playbook… I want you to utilize that playbook and help me in building a school management system. I want you to build the whole application, and on the basis of that we will be creating a guided document."),
  p("**What Claude did before asking anything:** read the whole playbook and checked the machine (Node 22 and pnpm installed; **no Docker, no Postgres**). Then it interviewed the founder:"),
  ...table(
    ["Question Claude asked", "Options", "Recommended", "Founder chose"],
    [
      ["Who is the customer?", "Many schools (SaaS) · one school · a school chain", "SaaS for many schools", "SaaS for many schools"],
      ["Who logs in during Phase 1?", "Admin · Teachers · Parents · Students", "Admin + Teachers", "All four"],
      ["Top features the first 10 schools demand?", "Students & classes · Attendance · Exams · Fees", "First three", "All four"],
      ["Which market / locale?", "India · USA · Generic", "India", "Generic / international"],
    ],
    [2500, 2700, 1800, 2026],
  ),
  ...note("A MISTAKE, OWNED", "Claude first jumped straight to the Stage 2 decision table. The founder ignored it and asked for a journal instead; Claude noticed it had skipped Stage 1 and restarted with the interview. Journal Entry 1 records this, because students make the same mistake."),
  prompt(2, "Keep a decision journal for the students", {
    Context: "Campusly; the interview has started. The founder will teach from this build.",
    Goal: "`docs/DECISION_JOURNAL.md`: every question asked, the options, Claude's recommendation and reason, the founder's answer, and the playbook rule that forced the question.",
    Rules: "§3.3: write down every founder answer the moment it is given.",
    Constraints: "Plain language for non-technical readers; one entry per round of questions; include mistakes.",
    Proof: "A student can read an entry and say why the question had to be asked.",
  }, "I want you to keep all these logs in a file that I will communicate to the students, that what kind of decision were made from my side… what kind of questions it will be asking in order to make the idea more relevant to the core requirements."),
  see("`SPEC.md` opens with *Customer: schools that today run admissions, attendance, marks and fees on paper or spreadsheets*. The journal has a table per round, and the competitor check is marked **cut**, not silently skipped."),
  audit("`docs/research/SPEC.md` exists; customer and job are one sentence each; six must-never lines; the journal records every question with options, recommendation and answer."),
  decide("Who is the customer: one organisation, or many?", "If you will ever sell it to a second organisation, every table needs an owner ID (here `school_id`) from day one. Adding it later means touching every query.", "A single-organisation internal tool can skip tenancy, but write that down as a decision so nobody adds a second customer without noticing."),
);

// ── STAGE 2 ───────────────────────────────────────────────────────────────────
add(
  stage(2, "PLAYBOOK §7 · 0:10–0:20", "Decide and lock: one table, one cut line", "`docs/DECISIONS.md` (the decision table and D-001 onward, \"do not reopen without the owner\") and `docs/PLAN.md` (scope, cut line, data model, roles × actions table, user stories with acceptance criteria)."),
  live("Show the two question rounds; this is the only stage where the playbook allows batching questions."),
  prompt(3, "The decision table", {
    Context: "Campusly; SPEC.md is approved.",
    Goal: "The 14-row decision table with Claude's recommendation and one reason per row; the cut line; user stories with Given/When/Then acceptance criteria; the build plan in slices.",
    Rules: "§7: every row is filled before feature code; anything that would double the build goes below the cut line, named.",
    Constraints: "Batch questions allowed here only. Flag anything 'thin' rather than dropping it.",
    Proof: "A stranger can read PLAN.md and say what ships on the last day and what does not.",
  }, "(Answered through Claude's question cards: \"Everything you picked\" · \"Stages 1–6 + 10\" · \"Next.js + embedded Postgres\" · \"Markdown in the repo\" · then \"Campusly\" · \"Calm & trustworthy\" · \"Email + password + Google\" · \"Per student, prices later\".)", "WHAT THE FOUNDER ANSWERED"),
  ...table(
    ["Decision", "Claude recommended (+ reason)", "Founder chose"],
    [
      ["Cut line", "All 4 modules and 4 roles; portals are read-only and cheap", "Everything"],
      ["How much of the playbook", "Stages 1–6 + 10: teachable, includes testing", "Stages 1–6 + 10"],
      ["Stack (no Docker on the machine)", "Next.js + embedded Postgres (PGlite): zero installs", "Accepted"],
      ["Product name", "Schoolbase", "**Campusly**"],
      ["Sign-in", "Email + password; 2FA later", "**+ Google** (button hidden until keys exist)"],
      ["Pricing unit (the flip test)", "Per student, stored as data", "Accepted"],
    ],
    [2700, 4100, 2226],
  ),
  p("Notice two overrides: name and sign-in. The playbook says to state the risk once, then build what the founder chose (§3.5). Claude did not re-argue."),
  see("PLAN.md's cut-line table lists every excluded stage **with what it would take**: AI layer, live email, payment gateway, 2FA, admin console, deploy and backups, marketing site. It also has a roles × actions table and eight user stories, S-01 to S-08."),
  ...code([
    "S-06 Fees — AC2: Given a double-click on \"Record payment\",",
    "                 then exactly one payment is stored (idempotency key).",
    "  → became tests/integration/exams-fees.test.ts AND tests/e2e/journey.spec.ts",
  ]),
  audit("Every row of the decision table has an answer; the cut line names each excluded item and what it would take; every story has acceptance criteria."),
  decide("What goes below the cut line?", "Anything that needs an account you don't have yet, or that would double the build: payments, AI, a second module, a native app.", "If a buyer refuses to sign without it, move it above the line and move something else down. Write that down too."),
);

// ── STAGE 3 ───────────────────────────────────────────────────────────────────
add(
  stage(3, "PLAYBOOK §8 · 0:20–0:30", "Brand: the product has a face before it has features", "Colours, fonts and corner radius defined once in `src/app/globals.css` as tokens (light and dark), four brand kits shown as real screens at `/dev/brand`, the founder's pick applied, and a sun/moon toggle on every page."),
  live("Open http://localhost:3000/dev/brand and scroll through the four kits, each in light and dark."),
  prompt(4, "Show me brand kits and let me pick", {
    Context: "Campusly; every screen exists and uses tokens only; D-007 picked 'Calm & trustworthy'.",
    Goal: "Four distinct brand kits rendered with the real components (a marketing hero and a dashboard each, light and dark) so the founder can choose one.",
    Rules: "§8.4: real screens, not mood boards; pick one, never blend. §21.14: reopening a locked decision means restating it, estimating impact and recording the new one.",
    Constraints: "Each kit changes tokens only; every text pair meets WCAG AA contrast (4.5:1); no component edits.",
    Proof: "The contrast check passes for all kits, and switching kits changes zero component files.",
  }, "improve the brand kit, suggest me some brand kits and I will select"),
  ...img(IMG + "s03-brand-kits.png", "/dev/brand: the four candidate kits, each built from the real product components", 6.0),
  ...img(IMG + "s03c-evergreen-top.png", "Evergreen, the founder's choice: the same dashboard in light and dark", 6.0),
  ...table(
    ["Kit", "Feel", "Lowest contrast"],
    [
      ["1 · Ink & Paper (Claude's recommendation)", "Academic, trustworthy; serif headings", "5.57 : 1"],
      ["2 · Evergreen (**founder's choice, D-013**)", "Friendly, natural; teal-green, rounded", "5.38 : 1"],
      ["3 · Sunrise", "Warm, energetic; coral, pill buttons", "4.57 : 1"],
      ["4 · Slate & Violet", "Bold, modern; tight corners", "5.75 : 1"],
    ],
    [3800, 3426, 1800],
  ),
  prompt(5, "A theme switch, always in the same place", {
    Context: "Campusly; Evergreen applied; dark mode followed the operating system only.",
    Goal: "A sun/moon button fixed top-right on every page that switches light/dark and remembers the choice.",
    Rules: "Brand tokens only; nothing may cover header buttons.",
    Constraints: "No flash of the wrong theme on load; first visit follows the OS setting.",
    Proof: "A browser test checks the button's position on every kind of page at desktop and phone width.",
  }, "always keep a sun/moon icon toggle on top right corner to switch between the themes"),
  ...img(IMG + "s14-dashboard-dark.png", "The principal's dashboard in dark mode; the moon/sun toggle sits top-right on every page", 6.0),
  see("The rebrand changed **one CSS file, the font import and the favicon**, and no screen code. That is the payoff of tokens. This instruction needed no questions because it was already precise; it was recorded as D-014 so a future session can't drop it."),
  audit("`grep` finds no hex colours in components; all eight light/dark palettes pass AA; `tests/e2e/theme.spec.ts` passes."),
  decide("What should a user feel in the first two seconds?", "Two adjectives you would defend to the buyer (\"friendly, trustworthy\"). The accent colour and fonts follow from them.", "If you can't name two, put real screens side by side and let the buyer point. Never decide brand from a mood board."),
);

// ── STAGE 4 ───────────────────────────────────────────────────────────────────
add(
  stage(4, "PLAYBOOK §9 · 0:30–0:35", "Architecture: few parts, each one boring", "A repo with TypeScript strict, a linter, `.env.example`, a CI workflow, and a stack that runs on any student's laptop with **zero installs beyond Node**."),
  prompt(6, "Pick a stack that runs everywhere", {
    Context: "Campusly; decisions locked; the machine has Node 22 and pnpm but no Docker or Postgres.",
    Goal: "A Next.js + TypeScript repo where `pnpm install && pnpm dev` runs the whole app, plus a CI file running types, lint, tests, build, audit and a secret scan.",
    Rules: "§9: one language, one database, one repo; popular libraries; the product must run with zero keys (§9.4 fallbacks).",
    Constraints: "Real Postgres semantics (not SQLite); no Docker requirement for students.",
    Proof: "A fresh clone runs on a machine with only Node installed.",
  }, "(No new prompt. Claude proposed PGlite, Postgres compiled to run inside Node, because the machine had no Docker, and the founder accepted it in Stage 2.)", "HOW THIS STEP STARTED"),
  ...table(
    ["Part", "Choice", "Why"],
    [
      ["Web + API", "Next.js (App Router), TypeScript strict", "One language end to end"],
      ["Database", "PGlite (embedded Postgres); real Postgres via `DATABASE_URL`", "No Docker for students; one setting to upgrade"],
      ["Auth", "Better Auth: email + password, Google when keys exist", "Never hand-rolled crypto"],
      ["Validation, styling", "Zod, Tailwind on brand tokens", "Popular, well documented"],
      ["Tests", "Vitest (unit + integration), Playwright (browser)", "§23 defaults"],
    ],
    [1900, 4026, 3100],
  ),
  p("**The tenancy wall starts here, in the linter.** Feature code is not allowed to import the raw database client:"),
  ...code([
    "// eslint.config.mjs",
    "\"no-restricted-imports\": [\"error\", { paths: [{ name: \"@/db/client\",",
    "  message: \"Use ctx.s (scoped client) — see docs/ENGINEERING_GUIDE.md §4.\" }] }]",
  ]),
  ...table(
    ["Fallback (§9.4)", "What Campusly does with no keys"],
    [["Email", "Dry run: stored in a mail log and shown at /dev/mail locally"], ["File storage", "A local folder"], ["Google sign-in", "Button hidden"], ["Payments", "Recorded manually; no gateway"]],
    [2600, 6426],
  ),
  audit("`pnpm typecheck` and `pnpm lint` are clean; `.env.example` lists every variable with no values; the app runs with no `.env` at all."),
  decide("Which stack?", "The most boring, popular option that runs on your users' and students' machines without extra installs. AI writes popular libraries best.", "If everyone already has Docker, use a real Postgres container. If the client mandates a stack, the playbook still applies; only the commands change."),
);

// ── STAGE 5 ───────────────────────────────────────────────────────────────────
add(
  stage(5, "PLAYBOOK §10 · 0:35–0:50", "Foundations: the parts every feature sits on", "The tenancy wall, one permission function, human codes, audit rows, mail, files, validation, money and time helpers, each with tests **written first and seen failing**."),
  live("Open `src/lib/can.ts`: one table of who may do what. Then open `tests/unit/money.test.ts` and ask the room why `0.29` is in a test."),
  prompt(7, "Foundations, tests first", {
    Context: "Campusly; stack ready; no feature code.",
    Goal: "Scoped client, `can()`, human codes (STU-0001), audit log, `sendMail()`, file checks, money in minor units, school-local dates, each with unit or integration tests.",
    Rules: "Must-never 1–3 (tenancy and roles) and 6 (no floats for money).",
    Constraints: "Write the tests first and run them red before writing code; real Postgres in tests, no mocks.",
    Proof: "Red then green: show the failing run, then the passing run, with counts.",
  }, "(Part of \"build the whole application\". Claude ran it from the plan, following §11.2.)", "HOW THIS STEP STARTED"),
  ...table(
    ["Foundation", "File", "The idea in one line"],
    [
      ["Tenancy wall", "src/db/scoped.ts", "Every query through `ctx.s` gets `school_id = …` added automatically"],
      ["One permission check", "src/lib/can.ts", "`can(member, action, resource)`; \"own\" grants fail closed"],
      ["Visibility filter", "loadStudentFor()", "If you can't see it, you get \"not found\", the same as a wrong ID"],
      ["Human codes", "src/db/codes.ts", "STU-0001 from an atomic counter, never from timestamps"],
      ["Audit", "src/db/audit.ts", "One row per change: who, what, before/after"],
      ["Money and time", "src/lib/money.ts, time.ts", "Integer cents; \"today\" in the school's timezone"],
    ],
    [2000, 2500, 4526],
  ),
  ...code([
    "$ pnpm vitest run tests/unit          # tests written, code not yet",
    " Test Files  4 failed (4)",
    "$ pnpm vitest run tests/unit          # after writing the code",
    " Test Files  4 passed (4)      Tests  18 passed (18)",
    "$ pnpm vitest run                     # integration + authorization matrix",
    " Test Files  9 passed (9)      Tests  119 passed (119)",
  ]),
  ...note("A REAL BUG, CAUGHT BY THE MATRIX", "The first green run found one: listing another school's student's documents returned an empty list instead of \"not found\". No data leaked, but it was inconsistent with every other lookup. It became rule INC-001: always load the parent record through the scoped client first."),
  audit("Every must-never line has at least one test; a user from School B gets \"not found\" for every School A record."),
  decide("What counts as a foundation?", "Anything every module would otherwise reinvent slightly differently: tenancy, permissions, audit, money, dates, email.", "If only one module needs it, build it inside that module. Foundations are for things that must be identical everywhere."),
);

// ── STAGE 6 ───────────────────────────────────────────────────────────────────
add(
  stage(6, "PLAYBOOK §11 · 0:50–1:05", "Feature slices: the same rhythm, four times", "Students & classes, attendance, exams & report cards and fees, each a complete slice (data → service → screen → tests), plus members, audit log and settings, checked in a real browser in light, dark and at phone width."),
  live("Sign in as `principal@example.com` and click through every tab. Then sign in as `parent@example.com` and try to open a sibling's page."),
  prompt(8, "Build one complete slice", {
    Context: "Campusly; foundations done; this slice is Fees (the others follow the same shape).",
    Goal: "Bill a whole class or one student, record payments, show paid / partly paid / overdue; parents see their children's invoices; teachers see none.",
    Rules: "Must-never 5 (no double payment) and 6 (money in cents); fees are staff-only (`can()`).",
    Constraints: "No payment gateway; brand tokens only; designed empty and error states.",
    Proof: "A double-clicked payment is stored once; parallel payments can't overpay; the dashboard total reconciles.",
  }, "(Part of \"build the whole application\". Each slice followed the module pattern below.)", "HOW THIS STEP STARTED"),
  ...code([
    "schema (src/db/schema.ts)",
    "  → service: validate (Zod) → can() → scoped query → audit   (src/lib/services/<module>.ts)",
    "  → server action: read named fields → call service           (src/app/s/[slug]/actions.ts)",
    "  → page with empty, loading and error states                 (src/app/s/[slug]/<module>/page.tsx)",
    "  → integration test + authorization-matrix rows + browser check",
  ]),
  ...img(IMG + "s05-dashboard-principal.png", "Principal's dashboard. $3,455 outstanding reconciles exactly with the invoices", 6.0),
  ...img(IMG + "s07-student-leo.png", "A student record: attendance, report card, fees, documents (signed 5-minute links) and edit details", 6.0),
  ...img(IMG + "s09-attendance.png", "Attendance: one tap per student; saving twice updates, never duplicates", 6.0),
  ...img(IMG + "s11b-fees-invoices.png", "Fees: paid, partly paid, unpaid and overdue, all in integer cents", 6.0),
  h2("Same app, different person: what each role sees"),
  ...img(IMG + "s16-dashboard-teacher.png", "Teacher (Daniel): only Grade 5-A, and only four tabs", 5.6),
  ...img(IMG + "s18-dashboard-parent.png", "Parent (Maria): one card per child; Leo's 75% = 226 of 300 marks", 5.6),
  ...img(IMG + "s19-parent-sibling-404.png", "Maria opens Aisha's page by URL and gets \"Not found\", with HTTP 404. No data, no hint that Aisha exists", 5.6),
  ...note("BUGS THE BROWSER CHECKS FOUND", "(1) Forbidden pages answered HTTP 200 because a loading screen made the page stream; it was removed. (2) The fees page was 669 px wide on a 375 px phone because hidden labels escaped the table's scroll box. (3) Tailwind v4 needed component classes written a new way. Each became a rule in docs/INCIDENT_RULES.md."),
  ...img(IMG + "s15-phone-fees.png", "Phone width (390 px): no sideways scrolling, 44 px tap targets", 2.6, 5.6),
  audit("Every screen has an empty, error and no-permission state; no horizontal scroll at 375 px; the numbers reconcile (12 students, $3,455 outstanding, 4 overdue)."),
  decide("Which slice do I build first?", "The one every other slice depends on: here, students and classes. Attendance, exams and fees all point at a student.", "If a demo is next week, build the slice the buyer will click first, but never leave a half-built screen. Hide it or finish it (§11)."),
);

// ── STAGE 7 ───────────────────────────────────────────────────────────────────
add(
  stage(7, "PLAYBOOK §15 · 1:05–1:20", "Quality: tests that would catch a real mistake", "155 automated tests (unit, integration, an authorization matrix and a browser suite against a production build), a live sabotage demo, and a red-team review by a second agent whose findings became tests."),
  ...table(
    ["Layer", "Where", "Count"],
    [["Unit (pure logic)", "tests/unit", "20"], ["Integration (real Postgres)", "tests/integration", "39"], ["Authorization matrix", "tests/integration/authz-matrix.test.ts", "71"], ["Browser (production build)", "tests/e2e", "25"], ["**Total**", "", "**155**"]],
    [3200, 4626, 1200],
  ),
  live("**The sabotage demo (2 minutes).** In `visibleStudents()`, let teachers see every student. Run `pnpm test`. Two tests go red. Undo. Green again. This is the playbook's Stage 10 gate: \"an authorization test fails when a visibility filter is removed\"."),
  ...code([
    "if (isStaff(ctx.member) || ctx.member.role === \"teacher\") return ctx.s.findMany(student)   // SABOTAGE",
    "$ pnpm test",
    "   × lists never leak across schools or roles",
    "   × teachers see only their own classes and students",
    "   Tests  2 failed | 78 passed",
  ]),
  prompt(9, "Red-team it with a second agent", {
    Context: "Campusly; all tests green; about to deploy.",
    Goal: "A list of every way to abuse the app, most severe first, each with file and line, the attack steps and the bad outcome.",
    Rules: "§15.3: a fresh reviewer, not the author; findings become tests before fixes.",
    Constraints: "Read-only: don't fix anything; say whether each finding was verified or is a suspicion.",
    Proof: "Every finding ends as a failing-then-passing test, a founder decision, or a written reason.",
  }, "List every way to abuse this feature: injection, auth bypass, data leak across workspaces, free-tier abuse, race conditions. Don't fix; list with severity.", "WHAT CLAUDE SENT TO THE REVIEWER AGENT"),
  ...table(
    ["Finding (13 in total)", "Severity", "Outcome"],
    [
      ["Anyone holding an invite link could sign up as the invitee without proving the email", "High", "Founder: require verified email (D-010)"],
      ["Admins could create admins; nobody could be removed", "High", "Founder: owner-only admins + removal (D-011)"],
      ["Unlimited schools per account; no storage cap", "Medium", "Founder: 3 schools, 500 MB (D-012)"],
      ["Open redirect via a hidden tab character after sign-in", "Medium", "Fixed + tests"],
      ["Changing currency after invoicing rescaled money", "Medium", "Fixed: currency locked once invoices exist"],
      ["Client IP header could be spoofed for rate limits", "Medium", "Deferred to deploy (written in the runbook)"],
      ["7 more (race conditions, token storage, overflow…)", "Low–Medium", "6 fixed, 1 accepted with a reason"],
    ],
    [4900, 1400, 2726],
  ),
  p("Three findings changed what users can do, so they went to the founder (journal Entry 6). The other ten were technical and fixed without asking. **The reviewer finds problems; it doesn't decide policy.**"),
  audit("130 unit/integration and 25 browser tests green; removing a filter turns tests red; every red-team finding has an outcome."),
  decide("Which tests do I write first?", "One per must-never line: the things that would make the buyer stop trusting the app after one incident. Then the journey a real user takes end to end.", "If a reviewer's finding is about *who should be allowed* to do something, it is a product decision. Take it to the founder with a recommendation."),
);

// ── STAGE 8 ───────────────────────────────────────────────────────────────────
add(
  stage(8, "PLAYBOOK §11 · DEMO DATA · 1:20–1:25", "Demo data: every role, every screen, every empty state", "Two schools of fictional people, 11 accounts covering every role and both empty states, 20 school days of attendance, 9 exams and invoices in every status; reset with one command."),
  prompt(10, "Sample data for every screen and every user", {
    Context: "Campusly; all screens built; the seed had 4 users.",
    Goal: "Seed data so every screen shows something for every role, plus accounts that show the empty states, and a second school for multi-school and tenancy demos.",
    Rules: "§2.2: fictional people at example.com only; seed through the real services so audit rows exist.",
    Constraints: "Keep the browser tests passing; one command to reset; print counts only.",
    Proof: "Each account signs in and shows its expected screen; the dashboard numbers reconcile.",
  }, "setup some sample data for testing for every screen and every type of users"),
  ...table(
    ["Account (password campusly-demo-1)", "Role", "What it shows"],
    [
      ["principal@example.com", "Owner · admin at Riverside", "Two schools in the picker; every screen"],
      ["admin@example.com", "Admin", "Everything except inviting admins"],
      ["teacher@example.com / teacher2@", "Teachers", "Marked today vs not; an unscored student"],
      ["newteacher@example.com", "Teacher, no class", "Empty state"],
      ["parent@example.com / parent2@", "Parents", "Two children (one overdue) / one child, paid"],
      ["newparent@example.com", "Parent, no child", "Empty state"],
      ["student@example.com / student2@", "Students", "Own record only"],
      ["riverside@example.com", "Owner, Riverside", "EUR and London time; can never see Maple Grove"],
    ],
    [3400, 2300, 3326],
  ),
  ...img(IMG + "s20-mail-sink.png", "Local mail sink: no email ever reaches a real inbox (must-never #4); verification and invite links are opened here", 6.0),
  audit("`pnpm seed:reset` rebuilds everything; 130 + 25 tests still green against the new seed; the parent dashboard shows exactly Leo and Mia."),
  decide("What makes good demo data?", "Every status a real user will meet: paid, partly paid, overdue; marked and not marked; a student with no class; an account with nothing linked.", "If your demo only shows the happy path, the first real user finds the empty screens for you. Seed them on purpose."),
);

// ── STAGE 9 ───────────────────────────────────────────────────────────────────
add(
  stage(9, "PLAYBOOK §4, §9 · 1:25–1:35", "A repository anyone can pick up", "PLAYBOOK.md and CLAUDE.md in the repo, one-command setup on Mac, Windows and Linux, a non-technical \"Get started\" section, and the code pushed to a private GitHub repository with its full stage-by-stage history."),
  prompt(11, "Everything a student needs, inside the repo", {
    Context: "Campusly; students are non-technical and will open the folder in Claude Code.",
    Goal: "PLAYBOOK.md and a CLAUDE.md that briefs every student's Claude (reading order, commands, rules, how to keep the journal); setup that works on every OS; a README a non-technical student can follow.",
    Rules: "§4.3: assume every new session has forgotten everything except the files.",
    Constraints: "No shell tricks that fail on Windows; no secrets in the repo; keep the git history (no ZIP downloads).",
    Proof: "A fresh clone installs, seeds, signs in and passes the tests.",
  }, "Make sure that everything is included inside the repo, either that is playbook.markdown file or that is claude.markdown file. Everything should be included inside the repo, so they are able to work on this."),
  prompt(12, "Create a private repository and push", {
    Context: "Campusly; 11 commits locally; signed in to GitHub in Chrome.",
    Goal: "A private GitHub repository named campusly with every commit pushed.",
    Rules: "§2.1: no secrets in the repo; scan before pushing.",
    Constraints: "Create it in the browser with the extension; push from the terminal using the machine's existing GitHub login.",
    Proof: "The repo page shows Private and all commits; the secret scan finds nothing.",
  }, "now use the browser and create a private repo and push this code there"),
  ...img(DEP + "04-github-new-private-repo.jpg", "Claude filled in the new-repository form: name, description, Private, no README", 5.6),
  ...img(DEP + "06-github-code-pushed.jpg", "Pushed over SSH with the Mac's existing GitHub key: the full history, private", 5.6),
  h2("How students get started (from the README)"),
  ...steps([
    "**Get the code with its history.** Use GitHub Desktop → Code → *Open with GitHub Desktop* (not \"Download ZIP\", which drops the history the lessons rely on).",
    "**Install Node.js** (LTS, 22 or newer) from nodejs.org.",
    "**Open the folder in Claude Code** and send: *Read this project's README, GUIDE.md and docs folder. Explain what the app does, how it's organised, and how it follows the playbook. Then set it up and run it for me.*",
  ]),
  audit("Fresh clone: installed in 3 s, seeded on first `pnpm dev`, demo sign-in returned 200, 130 tests passed. `git grep` finds no keys or tokens."),
  decide("Public or private repository?", "Public if nothing in it is secret and you want branch protection on GitHub's free plan. Private if the code is commercial.", "With a private repo on the free plan, anyone added as a collaborator can push to `main`. Use forks and pull requests instead, or a paid plan."),
);

// ── STAGE 10 ──────────────────────────────────────────────────────────────────
add(
  stage(10, "PLAYBOOK §16 · STAGE 11 · 1:35–1:55 · IN PROGRESS", "Deploy on AWS: the agent clicks, the human approves", "A $25 budget alarm, a read-only GitHub token, and an AWS Lightsail server in Mumbai with a fixed IP and HTTPS open. The site going live is the first item for the next session."),
  prompt(13, "Deploy it, doing as much as allowed", {
    Context: "Campusly; tests green; a new AWS account with free credits; the Claude in Chrome extension connected.",
    Goal: "The app live on an HTTPS address that students can open, at the lowest monthly cost.",
    Rules: "§2.4: the agent never creates accounts, enters card details, types passwords, accepts terms or handles secret tokens; billing steps need the human's click.",
    Constraints: "Demo mode on the public site (sign-up closed, demo accounts listed); budget alarm before anything that costs money; scripts tested locally first.",
    Proof: "https://campusly.35-154-168-246.sslip.io answers, and a demo account signs in from a phone.",
  }, "Let's try to create the AWS account for me. Use extensions, perform most of the tasks by yourself, ask me to take action only when it is required."),
  ...table(
    ["Decision", "Choice", "Why"],
    [
      ["Host", "AWS Lightsail, $12/month (2 GB)", "Fewest screens, fixed price; the build needs 2 GB"],
      ["Region", "Mumbai (ap-south-1)", "Closest to the students"],
      ["Address", "Free sslip.io name with automatic HTTPS", "No domain to buy, no DNS"],
      ["Sign-up on the live site", "Closed: demo accounts only", "No email service yet to verify new accounts"],
    ],
    [2300, 3226, 3500],
  ),
  ...table(
    ["Claude did (through the extension)", "The founder did"],
    [
      ["Opened every page and filled every form", "Created the AWS account: email, password, card, phone"],
      ["Budget alarm: Monthly cost budget, $25", "Typed their own email for alerts"],
      ["Token form: one repo, read-only, 90 days", "Confirmed their GitHub password; generated and copied the token"],
      ["Lightsail form: Mumbai, Ubuntu 24.04, $12, launch script", "Pasted the token; clicked **Create instance** (the billing step)"],
      ["Static IP and HTTPS firewall rule", ""],
    ],
    [4513, 4513],
  ),
  ...img(DEP + "03-budget-monthly-25.jpg", "Step 1: a $25 monthly budget alarm, set before anything costs money", 5.6),
  ...img(DEP + "08-github-token-readonly.jpg", "Step 2: a token that can only read this one repository, for 90 days", 5.6),
  ...img(DEP + "11-lightsail-plan-12.png", "Step 3: the $12 plan. Claude first mis-clicked the $164 plan when the page shifted, and caught it in the next screenshot", 5.0),
  ...img(DEP + "13-lightsail-launch-script.jpg", "Step 4: the launch script installs Node, Caddy (HTTPS) and the app on first boot", 5.6),
  ...img(DEP + "16-static-ip-attached.jpg", "Step 5: a fixed IP, so the address never changes", 5.6),
  ...img(DEP + "17-firewall-https-443.jpg", "Step 6: open HTTPS (port 443) to the internet", 5.6),
  ...note("TWO REAL HICCUPS, KEPT FOR TEACHING", "(1) The first **Create instance** click happened in another window and created nothing; Claude checked the instance list, found it empty, and refilled the form. (2) Claude's click landed on the **$164** plan when the page shifted; the next screenshot caught it before anything was created. Lesson: **always re-check the plan, and check the list after creating.**"),
  ...note("STATUS", "The server is running and both AWS health checks pass, but the site did not answer about 20 minutes after creation, and Lightsail's browser terminal refused to log in. Diagnosing it from the setup log is the first task next time; the full click-by-click guide is in `docs/DEPLOY_AWS.md`.", ACCENT_SOFT, ACCENT),
  decide("Which host, and which plan?", "The cheapest single server that can build and run the app (here 2 GB of memory). Free credits are account-wide, so cheaper means they last longer.", "If no one on the team will look after a server, choose a managed platform and accept the higher monthly cost. Write the trade-off down."),
);

// ── Result / Practice / Troubleshooting / What's next ─────────────────────────
add(
  h1("4. Result so far", true),
  p("One vague sentence became Campusly: a multi-school app with four modules and five roles, a brand chosen from real screens, **155 tests** including an authorization matrix and a red-team review, **13 commits** that mirror the playbook stages, a decision journal of every question the founder answered, a repository a non-technical student can run with one prompt, and an AWS server one step from live."),
  p("More important than the app: **13 prompts** you can reread, each shown as what was typed next to the five-line version, and **ten decision boxes** that tell you how to make the same call on your own idea."),
  h1("5. Practice: on your own idea, this week"),
  ...steps([
    "**Stages 1–2 (one hour).** Put PLAYBOOK.md in an empty folder and type your idea in one sentence. Answer Claude's questions; keep a decision journal. Stop when a stranger can read your PLAN.md and say what ships.",
    "**Stage 3 (30 minutes).** Ask for four brand kits as real screens and pick one. Check that no colour appears outside the tokens file.",
    "**Stages 5–6 (an evening).** Write your must-never list first, ask for a failing test per line, then build one complete slice.",
    "**Stage 10 (30 minutes).** Do the sabotage demo on your own app: remove one permission check and make sure a test goes red.",
  ]),
  h1("6. When things go wrong (all of these happened in this build)"),
  ...table(
    ["What happens", "Why", "What to do"],
    [
      ["The linter crashes: \"typescript-eslint does not support TS 7\"", "The newest TypeScript was ahead of the linter", "Pin TypeScript 6. Boring and working beats new"],
      ["\"Cannot apply unknown utility class btn\"", "Tailwind v4 changed how custom classes are written", "Use `@utility` blocks; don't name one `table`"],
      ["Migrations \"can't find meta/_journal.json\"", "A space in the folder path became %20", "Build paths with `path.join(process.cwd(), …)`"],
      ["Forbidden pages return HTTP 200", "A loading screen makes the page stream before the check", "Remove it from pages that check permissions"],
      ["The page scrolls sideways on phones", "Hidden labels escaped the table's scroll box", "Make every scroll box `position: relative`"],
      ["Sign-in returns 429 in a screenshot script", "The 5-per-minute sign-in limit is working", "Space out sign-ins; never raise the limit in production"],
      ["GitHub keeps asking for the password", "Confirmed in a different tab or window", "Confirm in the tab the agent is using"],
      ["Lightsail list is empty after \"Create\"", "The click happened in another window", "Check the list; refill the form in the agent's tab"],
      ["Browser SSH: CLIENT_UNAUTHORIZED [769]", "First-boot setup still running, or the setup failed", "Wait and retry; then read /var/log/campusly-install.log"],
    ],
    [3000, 3013, 3013],
  ),
  h1("7. What comes next (added after the live session)"),
  ...bullets([
    "**Finish the deploy:** read the server's setup log, bring the site live, test it from a phone, and add the screenshots to this guide.",
    "**Build together, using the same five-line prompts:** a class notice board (shown live first), AI report-card comments (Stage 7: AI behind a provider switch, human review), a timetable, student CSV import, absence alerts for parents, CSV export, a printable report card, and archiving students.",
    "**Open decisions for the founder:** the Campusly domain and trademark check; when 2FA becomes mandatory; how students get repository access.",
  ]),
);

// ── Appendices ────────────────────────────────────────────────────────────────
add(
  h1("Appendix A: CLAUDE.md, the part that matters", true),
  p("Claude Code reads this file automatically whenever someone opens the folder, so every student's assistant starts with the same rules. The full file is in the repository."),
  ...code([
    "## Rules that are easy to break (each is enforced by lint or tests)",
    "- Tenancy wall: feature code reads/writes only via ctx.s (src/db/scoped.ts).",
    "- One permission check: can() in src/lib/can.ts. A new action → GRANTS, the roles",
    "  table in docs/PLAN.md, tests/unit/can.test.ts, and rows in the authz matrix.",
    "- Module pattern: schema → service (Zod .strict() → can() → ctx.s → audit()) →",
    "  thin server action → page with empty/error states → tests.",
    "- Tests first: write them, run them, see them fail, then build.",
    "- Money is integer minor units; dates are school-local.",
    "- Mail only through sendMail(). Colours/fonts only through tokens.",
    "",
    "## Working with the founder",
    "- Anything a school, parent or student could notice is the founder's call: ask one",
    "  question at a time, with options and one recommendation.",
    "- Keep the teaching log going: add every question and answer to",
    "  docs/DECISION_JOURNAL.md, and locked decisions to docs/DECISIONS.md.",
  ]),
  h1("Appendix B: The prompt template and the decision checklist"),
  p("Fill the five lines before every prompt. If you can't fill the Proof line, you aren't ready to type the prompt."),
  ...table(
    ["Line", "Your prompt"],
    [["Context", " "], ["Goal", " "], ["Rules", " "], ["Constraints", " "], ["Proof", " "], ["", "**Plan first.**"]],
    [1800, 7226],
  ),
  ...table(
    ["Decision", "The question to ask", "The signal"],
    [
      ["Customer", "One organisation, or many?", "A second customer ever → tenant ID from day one"],
      ["Cut line", "What would double the build?", "Needs an account you don't have, or a second module"],
      ["Brand", "What should users feel in two seconds?", "Two adjectives you'd defend; pick from real screens"],
      ["Stack", "What runs on everyone's machine?", "Boring, popular, one language, zero extra installs"],
      ["Foundations", "What would every module reinvent?", "Tenancy, permissions, audit, money, dates, email"],
      ["First slice", "What does everything depend on?", "Students and classes"],
      ["Tests", "What breaks the buyer's trust?", "One test per must-never line, then the journey"],
      ["Demo data", "Which states will real users meet?", "Every status, plus the empty ones"],
      ["Repository", "Public or private?", "Secrets? Branch protection on your plan?"],
      ["Host", "Cheapest box that builds the app?", "Memory for the build; credits last longer when cheaper"],
    ],
    [1700, 3500, 3826],
  ),
);

// ══════════════════════════════════════════════════════════════════════════════
const numbering = {
  config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    ...Array.from({ length: listCounter }, (_, i) => ({
      reference: `steps${i + 1}`,
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } }, run: { bold: true, color: ACCENT } } }],
    })),
  ],
};

const doc = new Document({
  creator: "Instructor",
  title: "Idea to Live: Building Campusly with Claude Code and the Playbook",
  description: "Live session guided document",
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: INK } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { size: 44, bold: true, color: INK, font: FONT }, paragraph: { spacing: { after: 160 } } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: INK, font: FONT }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: ACCENT, font: FONT }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering,
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1200, left: 1440, right: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [TR({ text: "AI Operator · Live Session · Idea to Live: Campusly", size: 16, color: MUTED })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [TR({ text: "Page ", size: 16, color: MUTED }), TR({ children: [PageNumber.CURRENT], size: 16, color: MUTED })] })] }) },
      children: C,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, (buf.length / 1024 / 1024).toFixed(1) + " MB");
});
