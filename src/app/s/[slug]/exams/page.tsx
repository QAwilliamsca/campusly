import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Card, Empty, PageHeader, TableWrap } from "@/components/ui";
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

  return (
    <>
      <PageHeader title="Exams" description="Create an exam for a class, then enter each student's marks." />
      {classes.length > 0 && (
        <Card title="New exam" className="mb-6">
          <ActionForm action={createExamAction} className="grid gap-4 sm:grid-cols-6 sm:items-end" resetOnSuccess>
            <input type="hidden" name="slug" value={slug} />
            <div><label className="label" htmlFor="classId">Class</label><select id="classId" name="classId" className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label" htmlFor="name">Exam</label><input id="name" name="name" required maxLength={80} placeholder="Term 1" className="input" /></div>
            <div><label className="label" htmlFor="subject">Subject</label><input id="subject" name="subject" required maxLength={80} placeholder="Maths" className="input" /></div>
            <div><label className="label" htmlFor="maxMarks">Max marks</label><input id="maxMarks" name="maxMarks" type="number" min={1} max={1000} defaultValue={100} required className="input" /></div>
            <div><label className="label" htmlFor="heldOn">Held on</label><input id="heldOn" name="heldOn" type="date" defaultValue={todayIn(ctx.school.timezone)} required className="input" /></div>
            <SubmitButton pendingText="Creating…">Create exam</SubmitButton>
          </ActionForm>
        </Card>
      )}
      <Card>
        {exams.length === 0 ? (
          <Empty title="No exams yet" hint={classes.length ? "Create one above." : "You need a class before you can create an exam."} />
        ) : (
          <TableWrap>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Exam</th><th>Subject</th><th>Class</th><th>Max</th><th /></tr></thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id}>
                    <td>{e.heldOn}</td><td className="font-medium">{e.name}</td><td>{e.subject}</td><td>{className.get(e.classId) ?? "—"}</td><td>{e.maxMarks}</td>
                    <td><Link className="btn-secondary" href={`/s/${slug}/exams/${e.id}`}>Enter marks</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
