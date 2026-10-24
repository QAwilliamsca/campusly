import Link from "next/link";
import { getDb } from "@/db/client";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Logo } from "@/components/Logo";
import { Avatar, Badge, Card } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { listMySchools } from "@/lib/services/schools";
import { createSchoolAction } from "./actions";
import { SignOut } from "@/components/SignOut";

export const metadata = { title: "Your schools" };

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "AED", "JPY", "ZAR", "NGN", "KES"];

export default async function Schools() {
  const user = await requireUser();
  const schools = await listMySchools(await getDb(), user.id);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between gap-4 pr-14">
        <span className="flex items-center gap-2 font-semibold"><Logo /> Campusly</span>
        <SignOut />
      </header>
      <h1 className="text-3xl font-bold">Hello, {user.name}</h1>
      <p className="mt-1 text-sm text-muted">Choose a school, or create a new one.</p>

      <div className="mt-6 space-y-3">
        {schools.length === 0 && <p className="text-sm text-muted">You aren&apos;t a member of any school yet. Create one below, or open the invite link you were sent.</p>}
        {schools.map((s) => (
          <Link key={s.id} href={`/s/${s.slug}`} className="card flex items-center gap-4 p-4 transition-colors hover:bg-surface-2">
            <Avatar name={s.name} size="h-12 w-12 text-sm" />
            <span className="min-w-0 flex-1 truncate text-lg font-semibold">{s.name}</span>
            <Badge tone="info">{s.role}</Badge>
          </Link>
        ))}
      </div>

      <Card title="Create a school" className="mt-8">
        <ActionForm action={createSchoolAction} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="label" htmlFor="name">School name</label>
            <input id="name" name="name" required maxLength={120} className="input" placeholder="Maple Grove School" />
          </div>
          <div>
            <label className="label" htmlFor="currency">Currency</label>
            <select id="currency" name="currency" className="input" defaultValue="USD">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="timezone">Timezone</label>
            <select id="timezone" name="timezone" className="input" defaultValue="UTC">
              {Intl.supportedValuesOf("timeZone").concat("UTC").sort().map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3"><SubmitButton pendingText="Creating…">Create school</SubmitButton></div>
        </ActionForm>
      </Card>
    </main>
  );
}
