import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Badge, Card, Empty, PageHeader, TableWrap } from "@/components/ui";
import { hasAnyGrant } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { todayIn } from "@/lib/time";
import { listClasses } from "@/lib/services/classes";
import { listExams } from "@/lib/services/exams";
import { createExamAction } from "../actions";

export const metadata = { title: "Exams" };

export default async function Exams({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!hasAnyGrant(ctx.member, "exam.manage")) notFound();
  const [exams, classes] = await Promise.all([listExams(ctx), listClasses(ctx)]);
  const className = new Map(classes.map((c) => [c.id, c.name]));
  const today = todayIn(ctx.school.timezone);

  return (
    <>
      <PageHeader title="Exams" description="Create an exam for a class, then enter each student's marks." />
      <div className={classes.length > 0 ? "grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]" : ""}>
      {classes.length > 0 && (
        <Card title="New exam" className="h-fit xl:order-2">
          <ActionForm action={createExamAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1" resetOnSuccess>
            <input type="hidden" name="slug" value={slug} />
            <div><label className="label" htmlFor="classId">Class</label><select id="classId" name="classId" className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label" htmlFor="name">Exam</label><input id="name" name="name" required maxLength={80} placeholder="Term 1" className="input" /></div>
            <div><label className="label" htmlFor="subject">Subject</label><input id="subject" name="subject" required maxLength={80} placeholder="Maths" className="input" /></div>
            <div><label className="label" htmlFor="maxMarks">Max marks</label><input id="maxMarks" name="maxMarks" type="number" min={1} max={1000} defaultValue={100} required className="input" /></div>
            <div><label className="label" htmlFor="heldOn">Held on</label><input id="heldOn" name="heldOn" type="date" defaultValue={today} required className="input" /></div>
            <div><SubmitButton pendingText="Creating…">Create exam</SubmitButton></div>
          </ActionForm>
        </Card>
      )}
      <Card title="All exams" className="min-w-0 xl:order-1">
        {exams.length === 0 ? (
          <Empty title="No exams yet" hint={classes.length ? "Create one above." : "You need a class before you can create an exam."} />
        ) : (
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Exam</th><th>Subject</th><th>Class</th><th>Out of</th><th>Status</th><th /></tr></thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id}>
                    <td className="text-muted">{e.heldOn}</td><td className="font-semibold">{e.name}</td><td>{e.subject}</td><td>{className.get(e.classId) ?? "—"}</td><td>{e.maxMarks}</td>
                    <td>{e.heldOn > today ? <Badge tone="info">Upcoming</Badge> : <Badge tone="success">Held</Badge>}</td>
                    <td><Link className="btn-secondary" href={`/s/${slug}/exams/${e.id}`}>Enter marks</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
      </div>
    </>
  );
}
