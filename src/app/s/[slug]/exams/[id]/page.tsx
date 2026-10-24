import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Avatar, Card, Empty, PageHeader } from "@/components/ui";
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
      <Card title="Marks">
        {students.length === 0 ? (
          <Empty title="This class has no students" />
        ) : (
          <ActionForm action={enterMarksAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="examId" value={exam.id} />
            <ul className="grid gap-2 lg:grid-cols-2">
              {students.map((s) => (
                <li key={s.id} className="tile flex items-center gap-3 p-3">
                  <Avatar name={`${s.firstName} ${s.lastName}`} size="h-9 w-9 text-xs" />
                  <span className="min-w-0 flex-1"><label htmlFor={`score-${s.id}`} className="block truncate font-semibold">{s.firstName} {s.lastName}</label><span className="block font-mono text-xs text-muted">{s.code}</span></span>
                  <input id={`score-${s.id}`} name={`score:${s.id}`} type="number" min={0} max={exam.maxMarks} step={1} defaultValue={scores.get(s.id) ?? ""} className="input w-24 text-right" />
                  <span className="w-12 text-right text-xs text-muted">/ {exam.maxMarks}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4"><SubmitButton>Save marks</SubmitButton></div>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
