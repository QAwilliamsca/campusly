import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Card, PageHeader } from "@/components/ui";
import { can } from "@/lib/can";
import { requireCtx } from "@/lib/session";
import { updateSettingsAction } from "../actions";

export const metadata = { title: "Settings" };

export default async function Settings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireCtx(slug);
  if (!can(ctx.member, "school.settings")) notFound();
  const zones = Intl.supportedValuesOf("timeZone").concat("UTC").sort();
  return (
    <>
      <PageHeader title="Settings" />
      <Card className="max-w-xl">
        <ActionForm action={updateSettingsAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <div><label className="label" htmlFor="name">School name</label><input id="name" name="name" defaultValue={ctx.school.name} required maxLength={120} className="input" /></div>
          <div>
            <label className="label" htmlFor="currency">Currency (ISO code)</label>
            <input id="currency" name="currency" defaultValue={ctx.school.currency} required maxLength={3} className="input w-32 uppercase" aria-describedby="cur-hint" />
            <p id="cur-hint" className="mt-1 text-xs text-muted">Locked once the first invoice exists, so amounts are never rescaled.</p>
          </div>
          <div><label className="label" htmlFor="timezone">Timezone</label><select id="timezone" name="timezone" defaultValue={ctx.school.timezone} className="input">{zones.map((z) => <option key={z}>{z}</option>)}</select></div>
          <SubmitButton>Save settings</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
