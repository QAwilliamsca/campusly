// Builds docs/Campusly-Live-Session-Idea-to-Live.docx — the student guided document.
// Session approach: fork the public repo → Explore (read-only) every built stage, with evidence → Build new
// features on your own branches → see the same app live on AWS EC2 (Part 13) → appendices.
// Run: see docs/guide-src/README.md
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, HeadingLevel, ImageRun, Header, Footer, PageNumber, LevelFormat, TableLayoutType,
} = require("docx");

const ROOT = process.env.PROJECT;
const IMG = ROOT + "/docs/guide-img/";
const DEP = ROOT + "/docs/deploy/img/";
const OUT = ROOT + "/docs/Campusly-Live-Session-Idea-to-Live.docx";

// Evergreen brand (D-013)
const ACCENT = "0B6E5F", ACCENT_SOFT = "E3F3EF", INK = "16201C", MUTED = "55635C", GREY = "F1F3F0", WARN = "FCF0DC", WARN_INK = "8D4A06", BORDER = "DBE3DA", BUILD = "1F4E79", BUILD_SOFT = "E7EEF7";
const W = 9026; // A4 content width (DXA) with 1" side margins
const FONT = "Arial", MONO = "Courier New";
const TR = (o) => new TextRun(typeof o === "string" ? { text: o, font: FONT } : { font: FONT, ...o });

// ── inline formatting: **bold**, *italic*, `code` ─────────────────────────────
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
const part = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [TR(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [TR(text)] });
const label = (text, color = ACCENT) => new Paragraph({ children: [TR({ text, bold: true, color, size: 18, characterSpacing: 20 })], spacing: { before: 160, after: 60 }, keepNext: true });

let listCounter = 0;
const bullets = (items) => items.map((t) => new Paragraph({ children: runs(t), numbering: { reference: "bullets", level: 0 }, spacing: { after: 60, line: 264 } }));
const steps = (items) => {
  const ref = `steps${++listCounter}`;
  return items.map((t) => new Paragraph({ children: runs(t), numbering: { reference: ref, level: 0 }, spacing: { after: 70, line: 264 } }));
};

// ── tables & boxes ────────────────────────────────────────────────────────────
const line = (c = BORDER, s = 4) => ({ style: BorderStyle.SINGLE, size: s, color: c });
const cellBorders = { top: line(), bottom: line(), left: line(), right: line() };
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none };
function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((c) =>
    c instanceof Paragraph ? c : new Paragraph({ children: runs(c, { size: o.size || 19, bold: o.bold, color: o.color, italics: o.italics }), spacing: { after: 40, line: 252 } }),
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
const T = (widths, rows) => new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows });
function table(headers, rows, widths) {
  const head = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { fill: ACCENT, color: "FFFFFF", bold: true, size: 18 })) });
  const body = rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? "FAFBF9" : undefined })) }));
  return [T(widths, [head, ...body]), p("", { after: 80 })];
}
// Prompt box. kind: "EXPLORE" (read-only, green) or "BUILD" (changes code, blue)
function promptBox(kind, id, title, five) {
  const dark = kind === "BUILD" ? BUILD : ACCENT, soft = kind === "BUILD" ? BUILD_SOFT : ACCENT_SOFT;
  const L = 1600, R = W - L;
  const rows = [
    new TableRow({ children: [cell(`${kind} PROMPT ${id}`, L, { fill: dark, color: "FFFFFF", bold: true, size: 18 }), cell(title, R, { fill: dark, color: "FFFFFF", bold: true })] }),
    ...["Context", "Goal", "Rules", "Constraints", "Proof"].map((k) => new TableRow({ cantSplit: true, children: [cell(k, L, { fill: soft, bold: true }), cell(five[k], R)] })),
    new TableRow({ children: [cell("", L, { fill: soft }), cell("**Plan first.**", R)] }),
  ];
  return [T([L, R], rows), p(kind === "EXPLORE" ? "*Copy all five lines and \"Plan first.\" into Claude Code as one message.*" : "*Copy all five lines and \"Plan first.\" into Claude Code. Read the plan before you say \"go\".*", { run: { size: 17, color: MUTED }, after: 140 })];
}
// Evidence checklist: [fact, where]
function checklist(rows) {
  const A = 500, B = 5300, C = W - A - B;
  const head = new TableRow({ tableHeader: true, children: [cell("✓", A, { fill: ACCENT, color: "FFFFFF", bold: true }), cell("Claude should show you…", B, { fill: ACCENT, color: "FFFFFF", bold: true, size: 18 }), cell("Where it lives", C, { fill: ACCENT, color: "FFFFFF", bold: true, size: 18 })] });
  return [T([A, B, C], [head, ...rows.map(([f, w]) => new TableRow({ cantSplit: true, children: [cell("☐", A), cell(f, B), cell(w, C, { size: 17 })] }))]), p("", { after: 80 })];
}
function decide(question, signal, different) {
  const L = 2100, R = W - L;
  return [T([L, R], [
    new TableRow({ children: [cell("HOW YOU DECIDE THIS ON YOUR OWN IDEA", W, { fill: WARN, color: WARN_INK, bold: true, span: 2 })] }),
    new TableRow({ children: [cell("The question", L, { bold: true }), cell(question, R)] }),
    new TableRow({ children: [cell("The signal", L, { bold: true }), cell(signal, R)] }),
    new TableRow({ children: [cell("If the answer is different", L, { bold: true }), cell(different, R)] }),
  ]), p("", { after: 120 })];
}
function box(title, text, fill = ACCENT_SOFT, color = ACCENT, leftRule = false) {
  const b = leftRule ? { ...noBorders, left: line(color, 24) } : noBorders;
  return [T([W], [new TableRow({ children: [cell([new Paragraph({ children: [TR({ text: title + "  ", bold: true, color, size: 19 }), ...runs(text, { size: 19 })], spacing: { after: 20, line: 252 } })], W, { fill, borders: b })] })]), p("", { after: 120 })];
}
const verify = (text) => box("VERIFY", text, "F6F8F5", ACCENT, true);
function code(lines) {
  return [T([W], [new TableRow({ children: [cell(lines.map((l) => new Paragraph({ children: [TR({ text: l || " ", font: MONO, size: 17 })], spacing: { after: 0, line: 240 } })), W, { fill: GREY, borders: noBorders })] })]), p("", { after: 100 })];
}

// ── figures (numbered per part) ───────────────────────────────────────────────
function imgSize(buf) {
  if (buf[0] === 0x89) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  throw new Error("unknown image " + buf.length);
}
let figPart = 0, figNo = 0;
function fig(file, caption, maxWIn = 6.0, maxHIn = 7.4) {
  const data = fs.readFileSync(file);
  const { w, h } = imgSize(data);
  let width = maxWIn * 96, height = (width * h) / w;
  if (height > maxHIn * 96) { height = maxHIn * 96; width = (height * w) / h; }
  const n = `Figure ${figPart}.${++figNo}`;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 }, keepNext: true, children: [new ImageRun({ type: file.endsWith(".png") ? "png" : "jpg", data, transformation: { width: Math.round(width), height: Math.round(height) }, altText: { title: n, description: caption, name: n } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [TR({ text: n + "  ", bold: true, color: ACCENT, size: 17 }), TR({ text: caption, italics: true, color: MUTED, size: 17 })] }),
  ];
}
function partHead(no, title, intro) {
  figPart = no; figNo = 0;
  return [part(`Part ${no} · ${title}`), ...(intro ? [p(intro, { after: 160 })] : [])];
}

// ══════════════════════════════════════════════════════════════════════════════
const C = [];
const add = (...xs) => xs.flat().forEach((x) => C.push(x));

// ── Cover ─────────────────────────────────────────────────────────────────────
figPart = 0; figNo = 0;
add(
  new Paragraph({ children: [TR({ text: "AI Operator · Live Session · [Hands On] · Work along with this", bold: true, color: ACCENT, size: 18, characterSpacing: 20 })], spacing: { after: 120 } }),
  new Paragraph({ heading: HeadingLevel.TITLE, children: [TR("Idea to Live: Campusly, a School Management SaaS built with Claude Code and the Playbook")] }),
  p("You fork a finished, tested, live application. First you take it apart with Claude, stage by stage, and check every claim against the code. Then you extend it with new features, using the same method that built it. Finally you see how it went live on AWS.", { run: { size: 24, color: MUTED }, after: 240 }),
  label("THE PROBLEM"),
  p("Anyone can get an AI to produce a screen. Very few people can take an idea all the way to a product that stays correct, safe and deployable. The difference is not the AI: it is the method around it, and the questions asked before any code is written."),
  label("HOW THIS SESSION WORKS"),
  p("Campusly was built with **PLAYBOOK.md**, an operating manual for an AI agent. Its repository is **public**, and you work on your own fork of it. For every stage that is already built, you run a **read-only Explore prompt**: Claude finds that stage in the code and shows you the evidence, and you verify it yourself. Then you run **Build prompts** to add new features on your own branches. Both kinds of prompt use the same five-line formula. The session ends with the deployment: the same code, running on a real server."),
  ...box("EVERYONE USES", "Repository: **https://github.com/shivavashishtha/campusly**   ·   Live app: **https://campusly.13-127-195-244.sslip.io**"),
  label("WHAT YOU WILL HAVE AT THE END"),
  p("Your own fork of Campusly, running on your machine; a clear picture of how each playbook stage shows up in real code; at least one new feature you added yourself, with tests, in a pull request on your fork; an understanding of how the app reached a live server; and a prompt method you can reuse on any idea."),
  ...fig(IMG + "s01-landing.png", "Campusly, the application you fork, explore, extend and see go live"),
  h2("The session in four steps"),
  ...table(
    ["Step", "When", "What you do", "Parts"],
    [
      ["1 · Set up", "Before the session", "Fork the public repository, clone your fork, run the app", "0"],
      ["2 · Explore", "In the session", "Reverse-engineer each built stage with read-only prompts and verify the evidence yourself", "1–10"],
      ["3 · Build", "In the session, then on your own", "Add new features on your own branches, with tests, and open pull requests on your fork", "11"],
      ["4 · Go live", "End of the session", "See how the same code was deployed to AWS EC2, and explore the deploy scripts", "13"],
    ],
    [1500, 1900, 4426, 1200],
  ),
  h2("How this guide is organised"),
  ...table(
    ["Part", "What you do", "Prompt type"],
    [
      ["0", "Fork the public repository and run it on your machine", "Orient"],
      ["1", "Learn the method: the playbook, the prompt formula, Explore vs Build", "None"],
      ["2–10", "Reverse-engineer each stage that is already built, and verify it", "Explore (read-only)"],
      ["11", "Add new features to Campusly", "Build"],
      ["12", "Fix common problems", "None"],
      ["13", "See how the app went live on AWS EC2", "Explore, then instructor demonstration"],
      ["A–D", "Appendices: rules, templates, demo accounts, decision checklist", "None"],
    ],
    [1100, 5626, 2300],
  ),
);

// ── Part 0 · Get set up ───────────────────────────────────────────────────────
add(
  partHead(0, "Get set up", "Do this before the session. It takes about ten minutes, and you need no coding knowledge."),
  h2("0.1 What you need"),
  ...table(
    ["Item", "Where to get it"],
    [
      ["A free GitHub account", "github.com/signup (no invitation needed: the repository is public)"],
      ["GitHub Desktop (recommended)", "desktop.github.com"],
      ["Node.js 22 or newer (choose the LTS version)", "nodejs.org"],
      ["Claude Code", "As set up in earlier sessions"],
    ],
    [4500, 4526],
  ),
  h2("0.2 Get the code"),
  p("Campusly is a **public** repository. Everyone in the course uses this one address:"),
  ...box("THE REPOSITORY", "**https://github.com/shivavashishtha/campusly**   ·   Live demo of the finished app: **https://campusly.13-127-195-244.sslip.io**"),
  ...steps([
    "Sign in to GitHub and open **https://github.com/shivavashishtha/campusly**.",
    "Click **Fork** (top right) → **Create fork**. GitHub makes your own copy at **github.com/<your-username>/campusly**. You need your own copy because you can't push to the instructor's repository, and in Part 11 you push your own features.",
    "On **your fork's** page, click **Code → Open with GitHub Desktop**.",
    "Choose a folder on your computer and click **Clone**.",
    "Do **not** use \"Download ZIP\": it drops the history of commits, and Part 10 uses that history.",
  ]),
  ...fig(DEP + "09-github-repo-public.jpg", "The public repository: Fork is at the top right, Code → Open with GitHub Desktop is the green button", 5.8),
  ...verify("Your fork's page says **forked from shivavashishtha/campusly** under its name, and shows the same number of commits."),
  h2("0.3 Open it in Claude Code and run the Orient prompt"),
  p("Open the cloned folder in Claude Code. Claude automatically reads **CLAUDE.md**, the project's briefing file. Then send this prompt:"),
  ...promptBox("EXPLORE", "0.3", "Orient: set up and run Campusly", {
    Context: "I have just cloned my fork of the public Campusly repository (github.com/shivavashishtha/campusly). I am new to coding.",
    Goal: "Install what is needed, start the app, and explain in five short bullet points what Campusly is.",
    Rules: "Follow CLAUDE.md and the README.",
    Constraints: "Do not change any code. If Node.js is missing, tell me how to install it instead of trying workarounds. Never ask me to paste passwords or keys into the chat.",
    Proof: "The app runs at http://localhost:3000, and you tell me which demo account to sign in with.",
  }),
  h2("0.4 Sign in"),
  ...steps([
    "Open **http://localhost:3000** and click **Sign in**.",
    "Use **principal@example.com** with password **campusly-demo-1** (every demo account uses this password; all people are fictional).",
    "Choose **Maple Grove School**.",
  ]),
  ...fig(IMG + "s04-school-picker.png", "After signing in as the principal: two schools to choose from"),
  ...verify("You see the Maple Grove dashboard with **12 students**, **1 / 3** classes marked today and **$3,455.00** fees outstanding. If not, see Part 12."),
  h2("0.5 Compare with the live app"),
  p("The same code runs on the internet at **https://campusly.13-127-195-244.sslip.io**. Open it on your phone and sign in with the same account. Sign-up is closed there on purpose (it's a shared classroom demo), and the demo data is reset before each class. Your local copy is yours to change; the live one is not."),
);

// ── Part 1 · The method ───────────────────────────────────────────────────────
add(
  partHead(1, "The method"),
  h2("1.1 The playbook"),
  p("**PLAYBOOK.md** (in the repository) is an operating manual for an AI agent. It splits building a product into 14 stages in five tracks, and it sets rules for how the agent works with the person who owns the product (the *founder*)."),
  ...table(
    ["Track", "Stages", "In Campusly"],
    [
      ["Discover", "1 Research · 2 Decide & lock", "Built: Parts 2–3"],
      ["Design the base", "3 Brand · 4 Architecture · 5 Foundations", "Built: Parts 4–6"],
      ["Build", "6 Feature slices · 7 AI layer · 8 Integrations", "6 built: Part 7 · AI comes in Part 11"],
      ["Harden", "9 Admin · 10 Quality · 11 Deploy", "10 built: Part 8 · 11 built (live on EC2): Part 13"],
      ["Sell & scale", "12 Marketing · 13 Customers · 14 Scale", "Not in this course"],
    ],
    [1900, 4126, 3000],
  ),
  h2("1.2 Three ideas that run through everything"),
  ...steps([
    "**The founder decides; the agent proposes.** Anything a user could notice is the founder's call. Claude asks one question at a time, always with options and a recommendation. Technical choices are Claude's, and it writes them down.",
    "**Rules before features, tests before code.** First list what must never happen. Then write a test that fails if it happens. Only then build.",
    "**Done means verified, with a number.** A claim is not finished until there is evidence: a test count, a screenshot, a figure that adds up.",
  ]),
  h2("1.3 The five-line prompt formula"),
  p("Every prompt in this guide, and every prompt you write after it, has the same five lines in this order, and ends with **Plan first.**"),
  ...table(
    ["Line", "What it says"],
    [
      ["Context", "What this is and where we are"],
      ["Goal", "The one result, stated as something you can see"],
      ["Rules", "Which rules apply (the must-never rules, the playbook section)"],
      ["Constraints", "What not to do"],
      ["Proof", "How you will know it worked"],
    ],
    [1800, 7226],
  ),
  p("If you can't write the Proof line, you are not ready to send the prompt."),
  h2("1.4 Two kinds of prompt"),
  ...table(
    ["", "Explore prompt (Parts 0, 2–10, 13)", "Build prompt (Part 11)"],
    [
      ["Purpose", "Understand what is already built", "Add something new"],
      ["Changes files?", "**Never.** Always says \"Do not change any files\"", "Yes, on a separate branch"],
      ["What Claude returns", "Evidence: file names, the relevant lines, a command you can run", "A plan, then code, tests and a summary"],
      ["You finish by", "Ticking the checklist and doing the VERIFY step", "Checking the Proof line yourself"],
    ],
    [1900, 3563, 3563],
  ),
  h2("1.5 Campusly in one page"),
  p("**Who it's for:** schools that keep attendance, marks and fees on paper or spreadsheets. It is sold to **many schools**; each school's data is fully separate."),
  p("**The job, in one sentence:** give every school one place where admins, teachers, parents and students see the same, correct record of each student's attendance, marks and fees."),
  ...table(
    ["Role", "Sees", "Can change"],
    [
      ["Owner (principal)", "Everything in their school", "Everything; only the owner invites admins"],
      ["Admin", "Everything in their school", "Everything except inviting or removing admins"],
      ["Teacher", "Only the classes they teach", "Attendance and marks for those classes"],
      ["Parent", "Only their own children", "Nothing (read-only)"],
      ["Student", "Only themself", "Nothing (read-only)"],
    ],
    [1900, 3300, 3826],
  ),
);

// ── Part 2 · Research ─────────────────────────────────────────────────────────
add(
  partHead(2, "Research: what are we building, and for whom?"),
  h2("2.1 What this stage is for"),
  p("Before any code, the playbook turns a vague idea into one page: who the customer is, the one job they need done, the few features they need first, and the short list of things that must never happen. It does this by asking the founder questions, one at a time."),
  h2("2.2 Explore prompt"),
  ...promptBox("EXPLORE", "2.2", "Explain the product and how the idea was clarified", {
    Context: "This is the Campusly repository, built with PLAYBOOK.md. I am studying it, not changing it.",
    Goal: "Explain the product: who it is for, the job in one sentence, the main features, the five roles and what each can see, the main screens, and the things that must never happen. Then list the questions that were asked to turn the original idea into this.",
    Rules: "Only report what is in the repository, and name the file for every fact.",
    Constraints: "Do not change any files. Plain language. One page.",
    Proof: "Every point names a file, such as docs/research/SPEC.md, docs/PLAN.md or docs/DECISION_JOURNAL.md.",
  }),
  h2("2.3 What Claude should show you"),
  ...checklist([
    ["The customer: schools running attendance, marks and fees on paper or spreadsheets, sold to many schools", "docs/research/SPEC.md"],
    ["The job in one sentence (one shared, correct record per student)", "docs/research/SPEC.md"],
    ["Four modules: Students & classes, Attendance, Exams & report cards, Fees", "docs/research/SPEC.md, docs/PLAN.md"],
    ["Five roles and what each can see", "docs/PLAN.md (roles × actions table)"],
    ["**Six** must-never-happen lines (e.g. a parent never sees another family's child)", "docs/research/SPEC.md"],
    ["The interview questions: customer, who logs in, top features, market", "docs/DECISION_JOURNAL.md, Entry 2"],
  ]),
  h2("2.4 See it in the app"),
  ...fig(IMG + "s05-dashboard-principal.png", "Signed in as the principal: the four modules appear as tabs"),
  ...verify("Open `docs/research/SPEC.md` and count the must-never lines. There should be **six**. Then read Entry 2 of `docs/DECISION_JOURNAL.md` to see the four questions that were asked."),
  ...decide("Who is the customer: one organisation, or many?", "If you will ever sell to a second organisation, every record needs to say which organisation owns it from day one (Campusly uses `school_id`).", "A tool for one organisation can skip this, but write that down as a decision so nobody adds a second customer by accident."),
);

// ── Part 3 · Decide & lock ────────────────────────────────────────────────────
add(
  partHead(3, "Decide & lock: one table, one cut line"),
  h2("3.1 What this stage is for"),
  p("Every decision the build could get stuck on is made up front and written down with its reason. The **cut line** names what is deliberately left out, so nothing is quietly forgotten. Each feature gets **user stories with acceptance criteria**, and those later become tests."),
  h2("3.2 Explore prompt"),
  ...promptBox("EXPLORE", "3.2", "Show the decisions, the cut line and the user stories", {
    Context: "Campusly repository, built with PLAYBOOK.md; I am studying Stage 2 (Decide & lock).",
    Goal: "Summarise the locked decisions, what is in and out of Phase 1 (the cut line) with the reason for each, and the user stories with their acceptance criteria. Pick one acceptance criterion and show me the test that checks it.",
    Rules: "Only what the repository says; name the file for each point.",
    Constraints: "Do not change any files. Use tables.",
    Proof: "You show acceptance criterion S-06 AC2 (double-click payment) and the test file and test name that prove it.",
  }),
  h2("3.3 What Claude should show you"),
  ...checklist([
    ["**18** locked decisions, D-001 to D-018, each with a reason (D-016 is marked superseded by D-017)", "docs/DECISIONS.md"],
    ["The cut line: AI, real email, payment gateway, 2FA, admin console, marketing… each with \"what it would take\"", "docs/PLAN.md"],
    ["**8** user stories, S-01 to S-08, with Given / When / Then criteria", "docs/PLAN.md"],
    ["The roles × actions table (who may do what)", "docs/PLAN.md"],
    ["S-06 AC2 \"exactly one payment\" tested in two places", "tests/integration/exams-fees.test.ts and tests/e2e/journey.spec.ts"],
  ]),
  ...verify("Run `pnpm vitest run tests/integration/exams-fees.test.ts`. All tests pass, including *double-click: the same idempotency key records exactly one payment*."),
  ...decide("What goes below the cut line?", "Anything that needs an account you don't have yet, or that would double the build: payments, AI, a second module, a mobile app.", "If a buyer won't sign without it, move it above the line and move something else down. Record the change."),
);

// ── Part 4 · Brand ────────────────────────────────────────────────────────────
add(
  partHead(4, "Brand: the product has a face"),
  h2("4.1 What this stage is for"),
  p("Colours, fonts and corner shapes are defined **once**, as *tokens*, in one file. Screens use only the tokens, so the whole look can change by editing one file. Brand directions are compared as real screens, never as mood boards."),
  h2("4.2 Explore prompt"),
  ...promptBox("EXPLORE", "4.2", "Show how the brand is built and switched", {
    Context: "Campusly repository; I am studying Stage 3 (Brand).",
    Goal: "Show me where the colours, fonts and corner radius are defined, how dark mode works, how the theme toggle works, and how the four brand kits at /dev/brand were compared. Prove that screens use tokens instead of raw colours.",
    Rules: "PLAYBOOK §8: components use tokens only.",
    Constraints: "Do not change any files.",
    Proof: "You search the screens for hex colour codes (like #0b6e5f) and report how many you find outside the tokens file.",
  }),
  h2("4.3 What Claude should show you"),
  ...checklist([
    ["All brand tokens (Evergreen) in one place, light and dark", "src/app/globals.css"],
    ["Fonts: Fraunces for headings, Nunito Sans for text", "src/app/layout.tsx"],
    ["The sun/moon toggle and the script that sets the theme before the page appears", "src/components/ThemeToggle.tsx, src/app/layout.tsx"],
    ["Four brand kits compared as real screens", "src/app/dev/brand/ (page.tsx, kits.css)"],
    ["**Zero** hex colours in the screens", "src/app/s/, src/components/"],
    ["The decisions: Evergreen chosen; toggle always top-right", "docs/DECISIONS.md D-013, D-014"],
  ]),
  h2("4.4 See it in the app"),
  ...fig(IMG + "s03-brand-kits.png", "http://localhost:3000/dev/brand: four brand kits built from the real screens"),
  ...fig(IMG + "s03c-evergreen-top.png", "Evergreen, the chosen kit: the same screen in light and dark"),
  ...fig(IMG + "s14-dashboard-dark.png", "Click the moon (top-right) to switch to dark mode; the choice is remembered"),
  ...verify("Click the sun/moon button on any page and reload: your choice stays. Then run `pnpm exec playwright test tests/e2e/theme.spec.ts` (first time: `pnpm exec playwright install chromium`). **2 passed.**"),
  ...decide("What should a user feel in the first two seconds?", "Two adjectives you would defend to the buyer, such as \"friendly, trustworthy\". The colour and fonts follow from them.", "If you can't name two, put real screens side by side and let the buyer point."),
);

// ── Part 5 · Architecture ─────────────────────────────────────────────────────
add(
  partHead(5, "Architecture: few parts, each one boring"),
  h2("5.1 What this stage is for"),
  p("The playbook asks for one language, one database, one repository and popular, well-documented tools. The app must also run **with no keys or accounts at all**, using safe stand-ins for email, payments and file storage."),
  h2("5.2 Explore prompt"),
  ...promptBox("EXPLORE", "5.2", "Explain the stack and why it runs with no setup", {
    Context: "Campusly repository; I am studying Stage 4 (Architecture).",
    Goal: "List the main technologies and what each is for; explain how the database works without installing one; show the lint rule that protects school data; show what runs automatically on GitHub for every change; and list what stands in for email, payments and file storage when there are no keys.",
    Rules: "PLAYBOOK §9.",
    Constraints: "Do not change any files. Explain each technology in one line.",
    Proof: "You show the exact lint rule text and the list of steps in the GitHub workflow file.",
  }),
  h2("5.3 What Claude should show you"),
  ...checklist([
    ["Next.js 16, React 19, TypeScript, Drizzle, Better Auth, Zod, Tailwind", "package.json"],
    ["An embedded database (PGlite): real Postgres running inside Node, stored in .data/", "src/db/connect.ts"],
    ["A lint rule that blocks direct database access outside src/db", "eslint.config.mjs"],
    ["Every change on GitHub runs: typecheck → lint → tests → browser tests → audit → secret scan, and the latest run is green", ".github/workflows/ci.yml; the repository's **Actions** tab"],
    ["Every setting listed, none filled in", ".env.example"],
    ["Stand-ins: email goes to a local mail log; files to a local folder; no payment gateway", "src/lib/mail.ts, src/lib/files.ts"],
  ]),
  ...fig(IMG + "s20-mail-sink.png", "http://localhost:3000/dev/mail: emails are never really sent; they appear here"),
  ...verify("Run `pnpm typecheck` then `pnpm lint`. Both finish **with no errors**. Then open the **Actions** tab of https://github.com/shivavashishtha/campusly: the latest run has a green tick."),
  ...box("A REAL CI FAILURE FROM THIS BUILD", "For the first few pushes, every CI run failed in its first step and **no checks ran at all**: the pnpm version was written in two places (the workflow file and package.json), and the setup step refused to guess. The fix was deleting one line. Lesson: a red cross that nobody reads protects nothing. Check the Actions tab after you push.", WARN, WARN_INK),
  ...decide("Which technology stack?", "The most boring, popular option that runs on everyone's machine without extra installs. AI writes popular tools best.", "If everyone already has Docker, a separate Postgres database is fine. If a client requires a stack, keep the playbook; only the commands change."),
);

// ── Part 6 · Foundations ──────────────────────────────────────────────────────
add(
  partHead(6, "Foundations: the safety walls"),
  h2("6.1 What this stage is for"),
  p("Some parts must work the same way in every feature: keeping each school's data separate, checking permissions, numbering records, recording every change, handling money and dates. They are built once, **with tests written first**, before any feature exists."),
  h2("6.2 Explore prompt"),
  ...promptBox("EXPLORE", "6.2", "Show the safety walls and their tests", {
    Context: "Campusly repository; I am studying Stage 5 (Foundations).",
    Goal: "For each foundation (keeping schools' data separate, the single permission check, student and invoice numbers, the change log, money, dates, file uploads, email) tell me in one sentence what it guarantees, which file holds it, and which test proves it.",
    Rules: "The six must-never rules in docs/research/SPEC.md.",
    Constraints: "Do not change any files. Plain language: explain it as you would to a school principal.",
    Proof: "You run the unit tests and report the number that passed.",
  }),
  h2("6.3 What Claude should show you"),
  ...checklist([
    ["Every database query is automatically limited to the signed-in user's school", "src/db/scoped.ts"],
    ["One permission function decides who may do what", "src/lib/can.ts"],
    ["Records you aren't allowed to see answer \"Not found\", the same as a wrong link", "src/lib/services/students.ts (loadStudentFor)"],
    ["Student and invoice numbers (STU-0001, INV-0001) can never repeat", "src/db/codes.ts"],
    ["Every change writes a log row: who, what, before, after", "src/db/audit.ts"],
    ["Money is stored in whole cents, never decimals; \"today\" is the school's date", "src/lib/money.ts, src/lib/time.ts"],
    ["Uploads are checked by their real contents, not their file name", "src/lib/files.ts"],
  ]),
  ...code(["$ pnpm vitest run tests/unit", " Test Files  5 passed (5)", "      Tests  20 passed (20)"]),
  ...verify("Run `pnpm vitest run tests/unit`. **20 passed.** Then ask Claude: *why does tests/unit/money.test.ts check 0.29?* (Hint: type `0.29 * 100` into a JavaScript console.)"),
  ...decide("What counts as a foundation?", "Anything every feature would otherwise reinvent slightly differently: data separation, permissions, logging, money, dates, email.", "If only one feature needs it, build it inside that feature."),
);

// ── Part 7 · Feature slices ───────────────────────────────────────────────────
add(
  partHead(7, "Feature slices: every screen, every role"),
  h2("7.1 What this stage is for"),
  p("Each feature is built as a complete *slice*: data, rules, screen and tests together, one at a time, before the next one starts. Every screen has designed empty, error and no-permission states, and works on a phone."),
  h2("7.2 Explore prompt"),
  ...promptBox("EXPLORE", "7.2", "Map the screens, roles and the shape of a feature", {
    Context: "Campusly repository; I am studying Stage 6 (Feature slices).",
    Goal: "List every screen with its address and what it is for; which roles can see each one; and, using Fees as the example, walk me through the five layers of a feature from the database to the screen.",
    Rules: "The roles × actions table in docs/PLAN.md.",
    Constraints: "Do not change any files. One table for the screens.",
    Proof: "You give me one demo account per role, and for each account the tabs it should see.",
  }),
  h2("7.3 What Claude should show you"),
  ...checklist([
    ["11 school screens: dashboard, students, student detail, classes, attendance, exams, marks entry, fees, members, audit log, settings", "src/app/s/[slug]/"],
    ["One service file per module, holding all the rules", "src/lib/services/ (9 files)"],
    ["The five layers: database table → service → server action → screen → tests", "docs/ENGINEERING_GUIDE.md §3"],
    ["Owner: 9 tabs · Teacher: 4 tabs · Parent and student: dashboard only", "src/app/s/[slug]/layout.tsx"],
  ]),
  h2("7.4 See it in the app"),
  p("Signed in as **principal@example.com**:"),
  ...fig(IMG + "s07-student-leo.png", "A student's record: attendance, report card, fees, documents and editable details"),
  ...fig(IMG + "s09-attendance.png", "Attendance: one click per student; saving again updates instead of duplicating"),
  ...fig(IMG + "s11b-fees-invoices.png", "Fees: paid, partly paid, unpaid and overdue invoices"),
  p("Now the same app as other people:"),
  ...fig(IMG + "s16-dashboard-teacher.png", "teacher@example.com: only Grade 5-A, and only four tabs", 5.4),
  ...fig(IMG + "s18-dashboard-parent.png", "parent@example.com: one card per child", 5.4),
  ...fig(IMG + "s19-parent-sibling-404.png", "The parent pastes another child's link: \"Not found\", with no hint the child exists", 5.4),
  ...fig(IMG + "s15-phone-fees.png", "On a phone: no sideways scrolling", 2.6, 5.4),
  ...verify("Sign in as **parent@example.com** and note the two children (Leo and Mia). Then sign in as the principal, open **Aisha Khan**, copy the address, sign back in as the parent and paste it. You should see **Not found**."),
  ...decide("Which feature do I build first?", "The one everything else depends on. Here, students and classes, because attendance, exams and fees all point to a student.", "If a demo is coming, build the screen the buyer will click first, but never leave a half-built screen: finish it or hide it."),
);

// ── Part 8 · Quality ──────────────────────────────────────────────────────────
add(
  partHead(8, "Quality: tests that would catch a real mistake"),
  h2("8.1 What this stage is for"),
  p("Tests are written for the things that would make a school stop trusting the app. There are four layers, and a separate AI reviewer was asked to attack the app; everything it found became a test or a recorded decision."),
  h2("8.2 Explore prompt"),
  ...promptBox("EXPLORE", "8.2", "Show the test layers and the security review", {
    Context: "Campusly repository; I am studying Stage 10 (Quality).",
    Goal: "Explain the four test layers and how many tests each has; explain the authorization matrix in plain words; summarise what the security review found and what happened to each finding; and list the bugs the tests caught before any user saw them.",
    Rules: "PLAYBOOK §15.",
    Constraints: "Do not change any files.",
    Proof: "You run `pnpm test` and report the totals.",
  }),
  h2("8.3 What Claude should show you"),
  ...checklist([
    ["Unit **20** · Integration **39** · Authorization matrix **71** · Browser **25**", "tests/unit, tests/integration, tests/e2e"],
    ["The matrix tries every action as the wrong school and the wrong role, and expects refusal", "tests/integration/authz-matrix.test.ts"],
    ["13 security findings: 11 fixed, 1 deferred to deployment, 1 accepted with a reason", "docs/DECISION_JOURNAL.md Entry 6, tests/integration/redteam.test.ts"],
    ["3 bugs caught before release, each turned into a rule", "docs/INCIDENT_RULES.md"],
  ]),
  ...code(["$ pnpm test", " Test Files  11 passed (11)", "      Tests  130 passed (130)"]),
  h2("8.4 Try the sabotage test yourself"),
  p("This is the most convincing minute of the course: break a safety rule on purpose and watch the tests catch it. This prompt **does** change a file, then puts it back."),
  ...promptBox("BUILD", "8.4", "Break one rule on purpose, then undo it", {
    Context: "Campusly repository; tests currently pass.",
    Goal: "In src/lib/services/students.ts, make visibleStudents() let teachers see every student, run `pnpm test`, show me which tests fail, then undo the change with `git restore` and run the tests again.",
    Rules: "Must-never #2 and #3 (people only see their own students).",
    Constraints: "Change only that one line; restore it afterwards.",
    Proof: "First run: 2 tests fail. After restoring: all 130 pass, and `git status` shows no changes.",
  }),
  ...verify("You saw tests named *lists never leak across schools or roles* and *teachers see only their own classes and students* fail, then pass again."),
  ...decide("Which tests do I write first?", "One for each must-never line, then one for the journey a real user takes from start to finish.", "If a reviewer's finding is about *who should be allowed* to do something, it is a product decision: take it to the founder."),
);

// ── Part 9 · Demo data ────────────────────────────────────────────────────────
add(
  partHead(9, "Demo data: every role, every situation"),
  h2("9.1 What this stage is for"),
  p("Good demo data shows every situation a real user will meet, including the empty ones. Campusly creates two fictional schools automatically the first time you run it."),
  h2("9.2 Explore prompt"),
  ...promptBox("EXPLORE", "9.2", "List the demo accounts and what each one demonstrates", {
    Context: "Campusly repository; I want to test every screen as every type of user.",
    Goal: "List every demo account, its role, and what I should look at when signed in as it; and tell me how to reset the demo data.",
    Rules: "Only fictional people at example.com.",
    Constraints: "Do not change any files.",
    Proof: "Your list matches scripts/seed.ts and the README's Demo data section.",
  }),
  h2("9.3 What Claude should show you"),
  ...checklist([
    ["11 accounts across 2 schools, all with password campusly-demo-1", "scripts/seed.ts, README.md"],
    ["A teacher and a parent with nothing linked, to show the empty screens", "newteacher@, newparent@example.com"],
    ["A principal who belongs to both schools", "principal@example.com"],
    ["Reset everything: stop the app, then `pnpm seed:reset`", "package.json"],
  ]),
  ...verify("Sign in as **newteacher@example.com**: the dashboard says *You don't teach any class yet*. The full list of accounts is in Appendix C."),
  ...decide("What makes good demo data?", "Every status a real user will meet: paid, partly paid and overdue; marked and not marked; a student with no class; an account with nothing linked.", "If your demo only shows the happy path, your first real user finds the empty screens for you."),
);

// ── Part 10 · The repository ──────────────────────────────────────────────────
add(
  partHead(10, "The repository: how to read a project you didn't write"),
  h2("10.1 What this stage is for"),
  p("A project should explain itself to the next person, or the next AI session. Campusly keeps its decisions, plans and rules in files, and its history is one commit per stage."),
  h2("10.2 Explore prompt"),
  ...promptBox("EXPLORE", "10.2", "Map the documents and the build history", {
    Context: "Campusly repository; I want to find my way around it.",
    Goal: "Explain what each file in docs/ is for, what CLAUDE.md tells you, and walk me through the commit history in order, saying which playbook stage each commit belongs to.",
    Rules: "PLAYBOOK §2.8 (write it down where the next session will find it).",
    Constraints: "Do not change any files.",
    Proof: "You run `git log --oneline --reverse` and map every commit to a stage.",
  }),
  h2("10.3 What Claude should show you"),
  ...checklist([
    ["The playbook and the AI briefing file", "PLAYBOOK.md, CLAUDE.md"],
    ["Decisions, plan, decision journal, engineering guide, runbook, incident rules, notes, deployment guide", "docs/ (DEPLOY_AWS.md for the deployment)"],
    ["The server scripts", "deploy/"],
    ["One commit per stage, oldest first, starting with \"Stage 1–2: research, decision journal…\", then the deployment commits", "git log"],
    ["The next step for the project", "docs/NOTES.md (top)"],
  ]),
  ...verify("Run `git log --oneline --reverse`. The first commit is *Stage 1–2: research, decision journal, locked decisions, phase-1 plan*. Your fork has exactly the same history as the original; GitHub shows *This branch is up to date with shivavashishtha/campusly:main*."),
  ...decide("Should the repository be public or private?", "Public if nothing in it is secret and you want free protection of the main branch. Private if the code is commercial.", "Campusly chose **public** (decision D-018): students fork it with no invitations, and the server downloads it with no token. Before going public, the whole history was checked for secrets; a file deleted later still sits in old commits."),
);

// ── Part 11 · Build new features ──────────────────────────────────────────────
figPart = 11; figNo = 0;
add(
  part("Part 11 · Build new features"),
  p("Now you change the code, in **your fork**. Every Build prompt follows the same five lines, and names the rules from Parts 2–8 that the new feature must respect. Your changes never touch the instructor's repository or the live app."),
  h2("11.1 Before every feature"),
  ...steps([
    "Make sure the app's tests pass: `pnpm test`.",
    "Ask Claude: *Create a new git branch called feature/<short-name> and switch to it.*",
    "Send the Build prompt. **Read the plan Claude shows you** before saying \"go\". If something in it changes what users see and the prompt didn't decide it, Claude should ask you.",
  ]),
  h2("11.2 After every feature"),
  ...steps([
    "Check the **Proof** line yourself in the app.",
    "Ask Claude: *Run pnpm typecheck, pnpm lint and pnpm test, then commit with a message that says what was verified.*",
    "Ask Claude: *Push the branch to my fork and open a pull request into my fork's main branch.* (Or use GitHub Desktop: **Push origin**, then **Create Pull Request**, and choose **your fork** as the base, not the instructor's repository.)",
  ]),
  ...table(
    ["Feature", "Size", "Main skill it practises"],
    [
      ["11.3 Class notice board", "Small (the instructor builds this one first)", "A full slice: table, rules, screen, tests"],
      ["11.4 Archive a student", "Small", "Changing a record without losing its history"],
      ["11.5 Attendance export to CSV", "Small", "Safe file export"],
      ["11.6 Printable report card", "Small", "Printing and accessibility"],
      ["11.7 Absence alerts for parents", "Medium", "Notifications, permissions"],
      ["11.8 Timetable", "Medium", "Asking the founder before building"],
      ["11.9 Import students from CSV", "Medium", "Messy input, all-or-nothing writes"],
      ["11.10 AI report-card comments", "Medium", "Using AI safely (playbook Stage 7)"],
    ],
    [3300, 2800, 2926],
  ),
);

const features = [
  ["11.3", "Class notice board", "Teachers post notices to the classes they teach; admins post to any class or the whole school; parents and students see the notices for their children's or their own class on the dashboard.", "Must-never #1–#3 (each school, class and family sees only its own notices); one permission check in src/lib/can.ts.", "New table with school_id and a database migration (`pnpm db:generate --name notices`); follow the module pattern in docs/ENGINEERING_GUIDE.md; audit every post; titles max 120 characters, text max 2,000; brand tokens only.", "A teacher posts to Grade 5-A; parent@example.com sees it on the dashboard for Leo but not for Mia (Grade 6-B); a teacher cannot post to a class they don't teach (a test proves it); new rows added to the authorization matrix; all tests pass."],
  ["11.4", "Archive a student", "Staff can archive a student who has left. Archived students disappear from lists, attendance and billing, but their record, marks and invoices stay readable, and staff can restore them.", "Must-never #1 (scoped to the school); only staff may archive (can()).", "Do not delete any data; add an archived date rather than removing rows; existing invoices are unchanged; audit archive and restore.", "Archive Kai Müller: he disappears from the students list and from billing a class; his page is still reachable by staff with an \"Archived\" badge; restore brings him back; tests cover both."],
  ["11.5", "Attendance export to CSV", "Staff and the class teacher can download a class's attendance for a date range as a CSV file.", "Teachers only for their own classes; must-never #1.", "Escape any cell that starts with =, +, - or @ so spreadsheets can't run it as a formula; dates in the school's timezone; no new database tables.", "First admit a test student named \"=SUM(1)\" into Grade 5-A. Download Grade 5-A for the last two weeks and open it in a spreadsheet: one row per student per day, and \"=SUM(1)\" shows as plain text, not a formula; a teacher cannot export Grade 6-B (test)."],
  ["11.6", "Printable report card", "A clean, printable report card page for a student, with the school name, the student, every exam with percentage, the overall percentage and attendance.", "The same visibility as the report card: staff, the class teacher, the student's parents and the student only.", "Use the existing report-card data, not new calculations; print styles only (no PDF library); readable in black and white; no navigation or buttons on paper.", "As parent@example.com, open Leo's printable report card and print preview it: one A4 page, overall 75%; opening Aisha's printable card gives Not found."],
  ["11.7", "Absence alerts for parents", "When a student is marked absent, their parents get an in-app notification (a bell with a count) the next time they open Campusly. Email is not part of this feature.", "Parents see only alerts about their own children; must-never #4 (no real email is sent).", "New notifications table with school_id; created in the same step as saving attendance; saving the same absence twice must not create two alerts; mark as read.", "Mark Leo absent today as teacher@example.com; parent@example.com sees one alert; saving attendance again does not add a second; parent2@example.com sees nothing."],
  ["11.8", "Timetable", "A weekly timetable per class (day, period, subject, teacher) that staff edit, teachers see for their classes, and parents and students see for their own class.", "Teachers only for classes they teach; must-never #1.", "**Before planning, ask me the decisions a school would notice, one at a time, with options and your recommendation:** how many periods per day, whether periods have fixed times, what happens when a teacher is booked twice. Record my answers in docs/DECISION_JOURNAL.md and docs/DECISIONS.md.", "The journal has a new entry with my answers; a teacher cannot be booked in two classes in the same period (test); parent@example.com sees Grade 5-A's timetable for Leo."],
  ["11.9", "Import students from a CSV file", "Staff upload a CSV of students (first name, last name, date of birth, class) and see a preview with problems marked before anything is saved.", "Only staff; the plan's student limit still applies; student codes are still unique.", "Either every row is saved or none is; reject wrong or missing columns with a clear message; accept names with accents, apostrophes and other scripts; handle a file saved from Excel (UTF-8 with a BOM); maximum 500 rows.", "Import a file of 5 students with one bad date: the preview flags that row and nothing is saved; fix it and import: 5 new students with the next STU codes; a test covers the all-or-nothing rule."],
  ["11.10", "AI report-card comments", "On a student's report card, staff and the class teacher can click \"Draft comment\". Claude drafts a short, encouraging comment from the marks and attendance; the teacher edits and approves it before anyone else sees it.", "PLAYBOOK Stage 7: AI output is a draft that a human approves; only marks and attendance are sent, with no names or contact details; teachers only for their own classes.", "Read the API key from `ANTHROPIC_API_KEY` in .env (I add it myself; never ask me to paste it into the chat); put the model name in an environment setting, not in the code; if there is no key, show a clearly labelled sample draft; record each call (who, when, how long it took) without storing the student's data in the log; label approved comments \"AI-assisted\".", "With no key, the button shows a labelled sample draft; with a key, a real draft appears in a few seconds; nothing is visible to parents until the teacher approves it; a test proves a teacher can't draft for another class."],
];
for (const [id, title, goal, rules, constraints, proof] of features) {
  add(
    h2(`${id} ${title}`),
    ...promptBox("BUILD", id, title, { Context: "My fork of the Campusly repository, on a new feature branch; CLAUDE.md and the module pattern in docs/ENGINEERING_GUIDE.md apply.", Goal: goal, Rules: rules, Constraints: constraints, Proof: proof }),
  );
}
add(...box("WHEN THE INSTRUCTOR DEMONSTRATES 11.3", "Watch for three things: Claude reads CLAUDE.md before planning; the plan lists the new tests **before** the code; and the finished feature adds rows to the authorization matrix. Those three habits are what you repeat in 11.4 to 11.10."));

// ── Part 12 · Troubleshooting ─────────────────────────────────────────────────
add(
  partHead(12, "When things go wrong"),
  ...table(
    ["What you see", "Why", "What to do"],
    [
      ["`pnpm: command not found`", "pnpm isn't switched on yet", "Run `corepack enable`, or ask Claude to install pnpm"],
      ["The page at localhost:3000 doesn't open", "The app isn't running", "Run `pnpm dev` and wait for \"Ready\""],
      ["Sign-in says \"Too many attempts\"", "Sign-in is limited to 5 tries a minute (a security rule)", "Wait one minute and try again"],
      ["`pnpm seed:reset` fails or the data looks broken", "The app is still running and holding the database", "Stop `pnpm dev` first, then run it again"],
      ["Browser tests fail before starting", "The test browser isn't installed", "Run `pnpm exec playwright install chromium`"],
      ["A Build prompt's plan changes something users see that you didn't decide", "The prompt left a decision open", "Stop. Decide it yourself, or ask Claude for options and a recommendation"],
      ["Tests fail after your feature", "The new code broke an existing rule", "Ask Claude to explain the failing test before changing anything; never weaken a test to make it pass"],
      ["Push fails with *Permission denied* or *403*", "You cloned the instructor's repository instead of your fork", "Fork it (Part 0.2), then ask Claude: *point origin at my fork, github.com/<your-username>/campusly, and push again*"],
      ["On the live app, *Create an account* says sign-ups are closed", "The live app is a shared classroom demo (decision D-015)", "Sign in with a demo account; to try sign-up, use your local copy (emails appear at localhost:3000/dev/mail)"],
      ["You changed something by accident", "", "Ask Claude: *show me git status, then restore the files I didn't mean to change*"],
    ],
    [3000, 3013, 3013],
  ),
);

// ── Part 13 · Deploy (instructor demonstration) ───────────────────────────────
add(
  partHead(13, "Go live: deploy to AWS EC2", "Playbook Stage 11. You don't need an AWS account for this course. First you explore the deploy scripts in the repository, exactly as in Parts 2–10. Then the instructor shows how Campusly was put on an AWS EC2 server, with Claude doing the clicking through the Claude in Chrome extension. The result is live at https://campusly.13-127-195-244.sslip.io."),
  h2("13.1 Explore prompt"),
  ...promptBox("EXPLORE", "13.1", "Explain how the server sets itself up", {
    Context: "My fork of the Campusly repository; I am studying Stage 11 (Deploy).",
    Goal: "Explain, in order, what happens from the moment the EC2 server first boots until the site answers: which file runs first, what each script in deploy/ does, where the secret comes from, how the web address and HTTPS are set up, and how the site is updated later. Then list the deploy decisions and the mistakes recorded along the way.",
    Rules: "Only what the repository says; name the file for each step. PLAYBOOK §2.4 (the agent never handles accounts or secrets).",
    Constraints: "Do not change any files. Do not try to connect to any server.",
    Proof: "Your steps match docs/DEPLOY_AWS.md, and you name the line that makes the app run in demo mode.",
  }),
  ...checklist([
    ["User data runs once on first boot: downloads the public repository, then runs the installer", "deploy/ec2-user-data.sh"],
    ["The installer: swap memory, Node.js 22, Caddy, an app user, a secret generated **on the server**, seed, build, start", "deploy/install.sh"],
    ["Every boot: the address campusly.<ip-with-dashes>.sslip.io, the settings file (including DEMO_MODE=1) and HTTPS", "deploy/configure.sh"],
    ["The app restarts by itself if it crashes", "deploy/campusly.service"],
    ["Updating and resetting the live app: sudo campusly-update, sudo campusly-reset-demo", "deploy/update.sh, deploy/reset-demo.sh"],
    ["The decisions: demo mode, EC2, public repository; the Lightsail attempt superseded", "docs/DECISIONS.md D-015 to D-018, docs/DECISION_JOURNAL.md Entry 10"],
  ]),
  ...verify("Open **https://campusly.13-127-195-244.sslip.io**: the address bar shows a padlock. Sign in as **teacher@example.com**: you see Grade 5-A, the same as on your machine."),
  h2("13.2 Decisions"),
  ...table(
    ["Decision", "Choice", "Why"],
    [
      ["Host", "One AWS EC2 server: t3.small (2 vCPU, 2 GiB memory)", "The service you'll meet at work; the app's build needs 2 GB"],
      ["Operating system", "Ubuntu Server 24.04 LTS (not Pro)", "Long-term support; the setup script is tested on it"],
      ["Region", "Mumbai (ap-south-1)", "Closest to the students"],
      ["Web address", "A free sslip.io address with automatic HTTPS", "No domain to buy"],
      ["Code", "Public GitHub repository", "The server downloads it with no token"],
      ["Sign-up on the public site", "Closed; demo accounts only", "There is no email service yet to verify new accounts"],
    ],
    [2300, 3226, 3500],
  ),
  h2("13.3 Who does what"),
  p("The playbook never lets an AI create accounts, enter card details, type passwords or handle secret keys. So the work is split:"),
  ...table(
    ["Claude (through the browser extension)", "The person"],
    [
      ["Opens every page and fills in every form", "Creates the AWS account: email, password, card, phone"],
      ["Sets up a $25 monthly budget alarm", "Types their own email for the alerts"],
      ["Creates the GitHub repository, pushes the code, checks the history for secrets", "Confirms the GitHub password; decides public or private"],
      ["Fills in the token form (private repositories only)", "Generates and copies the token, and pastes it only into the server form"],
      ["Fills in the server form and attaches the fixed IP", "Clicks Launch instance (the step that costs money)"],
    ],
    [4513, 4513],
  ),
  h2("13.4 Budget alarm first"),
  ...steps(["Billing and Cost Management → **Budgets** → Create budget → **Monthly cost budget**, $25, your email → Create."]),
  ...fig(DEP + "03-budget-monthly-25.jpg", "The budget alarm, set before anything costs money", 5.6),
  h2("13.5 Create a read-only GitHub token (when the repository is private)"),
  p("Campusly's repository is public, so its server needs no token. **If your repository is private, the server cannot download it without one, and this step decides whether your deploy works.** On the first attempt the token was left empty, the download failed with *could not read Username for 'https://github.com'*, and the site never came up."),
  ...steps([
    "GitHub → your photo (top right) → **Settings** → **Developer settings** (bottom of the left menu).",
    "**Personal access tokens → Fine-grained tokens → Generate new token.**",
    "Token name **campusly-server-read**; Expiration **90 days**.",
    "Repository access: **Only select repositories** → choose **campusly**.",
    "Permissions → Repository permissions → **Contents: Read-only**. Nothing else (Metadata: Read-only is added by itself).",
    "GitHub asks for your password. Then click **Generate token** and copy it straight away: it is shown only once.",
  ]),
  ...fig(DEP + "08-github-token-readonly.jpg", "A token that can only read this one repository", 5.6),
  ...box("KEEP THE TOKEN SECRET", "Paste it **only** into the GITHUB_TOKEN=\"\" line of the server's user data (13.6, step 7), or into a terminal prompt that hides what you type. **Never** into a chat (including with Claude), a document, a screenshot or a commit. A token typed into a chat is a leaked token: delete it on GitHub and make a new one. Don't use a \"classic\" token (it starts with ghp_): it can read every repository you own.", WARN, WARN_INK),
  h2("13.6 Launch the server"),
  p("**EC2 → Instances → Launch instances**, then from top to bottom:"),
  ...steps([
    "**Name:** campusly.",
    "**Application and OS Images:** Quick Start → **Ubuntu**, then choose **Ubuntu Server 24.04 LTS** from the list. The default is 26.04; skip both **Ubuntu Pro** lines (they cost extra).",
    "**Instance type:** **t3.small**. The default t3.micro has too little memory for the build.",
    "**Key pair:** **Proceed without a key pair**. We use the browser terminal instead, so there is no key file to lose.",
    "**Network settings:** create a security group and tick **Allow SSH**, **Allow HTTPS** and **Allow HTTP** traffic from the internet.",
    "**Configure storage:** **20 GiB**.",
    "**Advanced details → User data:** paste the whole of deploy/ec2-user-data.sh from the repository. Public repository: leave GITHUB_TOKEN=\"\" empty. Private: put your token from 13.5 between the quotes.",
    "Re-read the **Summary** on the right: Ubuntu 24.04, t3.small, 20 GiB. Then the person clicks **Launch instance**.",
  ]),
  ...fig(DEP + "10-ec2-ubuntu-2404-not-pro.jpg", "Step 2: choose Ubuntu Server 24.04 LTS, not 26.04 and not Pro", 5.6),
  ...fig(DEP + "12-ec2-firewall.png", "Step 5: allow SSH, HTTPS and HTTP", 4.6),
  ...fig(DEP + "13-ec2-user-data.png", "Step 7: the user data that sets up the server by itself on first boot", 5.0),
  ...fig(DEP + "11-ec2-summary-t3small.jpg", "Step 8: the Summary to re-read before Launch", 5.6),
  ...fig(DEP + "14-ec2-launched.jpg", "The launch succeeded", 5.6),
  ...box("A MISTAKE WORTH REMEMBERING", "While Claude was clicking, the page shifted and the wrong instance type and Ubuntu Pro got selected. Later, a \"Confirm changes\" dialog appeared exactly over the wizard's **Cancel** button, and one click threw the whole form away. Nothing was launched by mistake, because the Summary was re-read every time. Whether a person or an AI is clicking: **one click, look, then the next click, and re-read the summary before any button that costs money.**", WARN, WARN_INK),
  h2("13.7 A fixed IP address"),
  ...steps([
    "**EC2 → Elastic IPs → Allocate Elastic IP address → Allocate.**",
    "**Actions → Associate Elastic IP address** → Instance: campusly → **Associate**.",
    "The web address is the IP with dots turned into dashes: **campusly.13-127-195-244.sslip.io**.",
  ]),
  ...fig(DEP + "15-elastic-ip-associated.jpg", "The Elastic IP 13.127.195.244, attached to the server", 5.6),
  h2("13.8 Go live"),
  ...steps([
    "Wait about 10 minutes while the server installs Node.js and Caddy, seeds the demo schools and builds the app.",
    "To watch: instance → **Connect → EC2 Instance Connect → Connect**, then type **sudo tail -n 20 /var/log/campusly-install.log**. It is done when the last line is **CAMPUSLY READY**.",
    "Open **https://campusly.13-127-195-244.sslip.io** and sign in with a demo account.",
  ]),
  ...fig(DEP + "16-live-site.jpg", "Campusly live on EC2, with automatic HTTPS", 5.8),
  ...verify("The address opens with a padlock (HTTPS), and **principal@example.com** / **campusly-demo-1** signs in."),
  h2("13.9 Updating the live site"),
  p("After pushing changes to GitHub: instance → Connect → EC2 Instance Connect, then type **sudo campusly-update**. It pulls the code, rebuilds and restarts in 2–3 minutes and keeps the data. **sudo campusly-reset-demo** restores the demo data."),
  p("The full click-by-click record is in docs/DEPLOY_AWS.md."),
);

// ── Appendices ────────────────────────────────────────────────────────────────
figPart = 99;
add(
  part("Appendix A · The rules Claude follows in this repository"),
  p("From **CLAUDE.md**, which Claude Code reads automatically when you open the folder."),
  ...code([
    "Rules that are easy to break (each is enforced by lint or tests)",
    "- Tenancy wall: feature code reads/writes only via ctx.s (src/db/scoped.ts).",
    "- One permission check: can() in src/lib/can.ts. A new action → GRANTS, the roles",
    "  table in docs/PLAN.md, tests/unit/can.test.ts, and rows in the authz matrix.",
    "- Module pattern: schema → service (Zod .strict() → can() → ctx.s → audit()) →",
    "  thin server action → page with empty/error states → tests.",
    "- Tests first: write them, run them, see them fail, then build.",
    "- Money is integer minor units; dates are school-local.",
    "- Mail only through sendMail(). Colours/fonts only through tokens.",
    "- The sun/moon theme toggle stays fixed top-right on every page.",
    "",
    "Working with the founder",
    "- Anything a school, parent or student could notice is the founder's call: ask one",
    "  question at a time, with options and one recommendation.",
    "- Add every question and answer to docs/DECISION_JOURNAL.md.",
  ]),
  h2("Appendix B · Blank prompt templates"),
  label("EXPLORE (read-only)"),
  ...table(["Line", "Your prompt"], [["Context", "This is the ___ repository; I am studying ___, not changing it."], ["Goal", " "], ["Rules", "Only report what is in the repository; name the file for every fact."], ["Constraints", "Do not change any files."], ["Proof", " "], ["", "**Plan first.**"]], [1800, 7226]),
  label("BUILD (changes code)"),
  ...table(["Line", "Your prompt"], [["Context", "___ repository on a new branch; CLAUDE.md applies."], ["Goal", " "], ["Rules", "Which must-never rules and permission rules apply?"], ["Constraints", "What must not change? What is out of scope?"], ["Proof", "What will I check in the app, and which test proves it?"], ["", "**Plan first.**"]], [1800, 7226]),
  h2("Appendix C · Demo accounts"),
  p("Every password is **campusly-demo-1**. All people are fictional. They work on your local copy (http://localhost:3000) and on the live app (https://campusly.13-127-195-244.sslip.io)."),
  ...table(
    ["Account", "Role", "What to look at"],
    [
      ["principal@example.com", "Owner of Maple Grove; admin at Riverside", "Two schools; every screen"],
      ["admin@example.com", "Admin", "Everything except inviting admins"],
      ["teacher@example.com", "Teacher, Grade 5-A", "Attendance marked today; four exams"],
      ["teacher2@example.com", "Teacher, Grade 6-B", "Not marked today; a student who missed an exam"],
      ["newteacher@example.com", "Teacher with no class", "Empty screens"],
      ["parent@example.com", "Parent of Leo and Mia", "Two children; Mia's fees overdue"],
      ["parent2@example.com", "Parent of Aisha", "One child, fees paid"],
      ["newparent@example.com", "Parent, no child linked", "Empty screen"],
      ["student@example.com", "Student (Leo Santos)", "Own record only"],
      ["student2@example.com", "Student (Aisha Khan)", "Own record only"],
      ["riverside@example.com", "Owner of Riverside Academy", "Euros, London time; can't see Maple Grove"],
    ],
    [2900, 3000, 3126],
  ),
  h2("Appendix D · The decision checklist"),
  ...table(
    ["Decision", "The question to ask", "The signal"],
    [
      ["Customer", "One organisation, or many?", "A second customer ever → mark every record's owner from day one"],
      ["Cut line", "What would double the build?", "Needs an account you don't have, or a second module"],
      ["Brand", "What should users feel in two seconds?", "Two adjectives; pick from real screens"],
      ["Stack", "What runs on everyone's machine?", "Boring, popular, one language, no extra installs"],
      ["Foundations", "What would every feature reinvent?", "Data separation, permissions, logging, money, dates"],
      ["First feature", "What does everything depend on?", "Here: students and classes"],
      ["Tests", "What breaks the buyer's trust?", "One test per must-never line, then the full journey"],
      ["Demo data", "Which situations will real users meet?", "Every status, plus the empty ones"],
      ["Repository", "Public or private?", "No secrets in any commit → public is simplest (students fork, the server needs no token)"],
      ["Host", "Cheapest server that can build the app?", "Enough memory for the build (Campusly: EC2 t3.small, 2 GiB); cheaper means the credit lasts longer"],
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
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } }, run: { bold: true, color: ACCENT, font: FONT } } }],
    })),
  ],
};

const doc = new Document({
  creator: "Instructor",
  title: "Idea to Live: Campusly with Claude Code and the Playbook",
  description: "Live session guided document",
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: INK } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { size: 44, bold: true, color: INK, font: FONT }, paragraph: { spacing: { after: 160 } } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: INK, font: FONT }, paragraph: { spacing: { before: 120, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: ACCENT, font: FONT }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering,
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1200, left: 1440, right: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [TR({ text: "AI Operator · Live Session · Idea to Live: Campusly", size: 16, color: MUTED })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [TR({ text: "Page ", size: 16, color: MUTED }), TR({ children: [PageNumber.CURRENT], size: 16, color: MUTED })] })] }) },
    children: C,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, (buf.length / 1024 / 1024).toFixed(1) + " MB");
});
