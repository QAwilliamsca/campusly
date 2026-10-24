import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverSecret } from "./secret";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const URL_TTL_MS = 5 * 60 * 1000;

const SIGNATURES: [string, number[]][] = [
  ["application/pdf", [0x25, 0x50, 0x44, 0x46]], // %PDF
  ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ["image/jpeg", [0xff, 0xd8, 0xff]],
];

/** Real file type from the first bytes — the extension is never trusted. */
export function detectType(bytes: Uint8Array): string | null {
  for (const [mime, sig] of SIGNATURES) if (sig.every((b, i) => bytes[i] === b)) return mime;
  return null;
}

export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  return base.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "file";
}

const sign = (docId: string, schoolId: string, exp: number) =>
  createHmac("sha256", serverSecret()).update(`${docId}.${schoolId}.${exp}`).digest("base64url");

export function signFileUrl(docId: string, schoolId: string, now = Date.now()) {
  const exp = now + URL_TTL_MS;
  return { exp, sig: sign(docId, schoolId, exp) };
}

export function verifyFileUrl(docId: string, schoolId: string, exp: number, sig: string, now = Date.now()): boolean {
  if (!Number.isFinite(exp) || now > exp) return false;
  const want = Buffer.from(sign(docId, schoolId, exp));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

// ── Storage: local-disk fallback for object storage (PLAYBOOK §9.4) ──────────
const root = () => process.env.UPLOAD_DIR || ".data/uploads";

export async function putFile(key: string, bytes: Uint8Array) {
  const file = path.join(root(), key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

export const getFile = (key: string) => readFile(path.join(root(), key));
