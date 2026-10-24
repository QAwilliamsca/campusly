import { getDb } from "@/db/client";
import { readDocument } from "@/lib/services/documents";

/** Signed, expiring download (PLAYBOOK §10 Files). No signature, no file. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const found = await readDocument(await getDb(), id, Number(url.searchParams.get("exp")), url.searchParams.get("sig") ?? "").catch(() => null);
  if (!found) return new Response("Link expired or invalid.", { status: 404 });
  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.doc.mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(found.doc.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
