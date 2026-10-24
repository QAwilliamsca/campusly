import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Card, Empty, PageHeader, TableWrap } from "@/components/ui";
import { AppError } from "@/lib/errors";
import { requireCtx } from "@/lib/session";
import { getExam } from "@/lib/services/exams";
import { enterMarksAction } from "../../actions";

export default async function ExamMarks({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const ctx = await requireCtx(slug);
  const data = await getExam(ctx, id).catch((e) => {
    if (e instanceof AppError) notFound();
    throw e;
  });
  const { exam, className, students, scores } = data;

  return (
    <>
      <PageHeader title={`${exam.name} · ${exam.subject}`} description={`${className} · ${exam.heldOn} · out of ${exam.maxMarks}. Leave a box empty for "not taken".`} />
      <Card>
        {students.length === 0 ? (
          <Empty title="This class has no students" />
        ) : (
          <ActionForm action={enterMarksAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="examId" value={exam.id} />
            <TableWrap>
              <table className="data-table">
                <thead><tr><th>Student</th><th>Score</th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td><label htmlFor={`score-${s.id}`} className="font-medium">{s.firstName} {s.lastName}</label> <span className="font-mono text-xs text-muted">{s.code}</span></td>
                      <td><input id={`score-${s.id}`} name={`score:${s.id}`} type="number" min={0} max={exam.maxMarks} step={1} defaultValue={scores.get(s.id) ?? ""} className="input w-28" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="mt-4"><SubmitButton>Save marks</SubmitButton></div>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
