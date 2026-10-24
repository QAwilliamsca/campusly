import { describe, expect, it } from "vitest";
import { detectType, safeFilename, signFileUrl, verifyFileUrl } from "@/lib/files";

const PDF = new TextEncoder().encode("%PDF-1.7 rest");
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // "MZ"

describe("file checks (PLAYBOOK §10 Files, §20.2)", () => {
  it("detects types by magic bytes, not extension", () => {
    expect(detectType(PDF)).toBe("application/pdf");
    expect(detectType(PNG)).toBe("image/png");
    expect(detectType(JPG)).toBe("image/jpeg");
    expect(detectType(EXE)).toBeNull();
    expect(detectType(new Uint8Array())).toBeNull();
  });

  it("sanitises malicious filenames", () => {
    expect(safeFilename("../../etc/passwd")).toBe("passwd");
    expect(safeFilename("report<script>.pdf")).toBe("report_script_.pdf");
    expect(safeFilename("")).toBe("file");
  });

  it("signed URLs verify, expire, and are bound to the school", () => {
    const now = 1_000_000;
    const { exp, sig } = signFileUrl("doc1", "schoolA", now);
    expect(verifyFileUrl("doc1", "schoolA", exp, sig, now + 1000)).toBe(true);
    expect(verifyFileUrl("doc1", "schoolB", exp, sig, now + 1000)).toBe(false);
    expect(verifyFileUrl("doc2", "schoolA", exp, sig, now + 1000)).toBe(false);
    expect(verifyFileUrl("doc1", "schoolA", exp, sig, exp + 1)).toBe(false);
    expect(verifyFileUrl("doc1", "schoolA", exp, "tampered", now)).toBe(false);
  });
});
