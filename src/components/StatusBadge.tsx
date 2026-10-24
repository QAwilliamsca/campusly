import { Badge } from "./ui";

export function StatusBadge({ status, overdue }: { status: "unpaid" | "partial" | "paid"; overdue: boolean }) {
  if (status === "paid") return <Badge tone="success">Paid</Badge>;
  return (
    <span className="inline-flex gap-1">
      <Badge tone={status === "partial" ? "warn" : "neutral"}>{status === "partial" ? "Partly paid" : "Unpaid"}</Badge>
      {overdue && <Badge tone="danger">Overdue</Badge>}
    </span>
  );
}
