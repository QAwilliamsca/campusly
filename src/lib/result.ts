export type Result = { ok: true; message?: string; at?: number } | { ok: false; error: string; at?: number } | null;
