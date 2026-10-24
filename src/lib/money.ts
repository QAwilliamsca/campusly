/** Decimal places a currency uses (USD 2, JPY 0, KWD 3), from the platform's ISO data. */
export function minorDigits(currency: string): number {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/** "12.50" → 1250. Parsed as a string so no float ever touches money. */
export function toMinor(input: string, currency: string): number {
  const digits = minorDigits(currency);
  const m = /^(\d{1,9})(?:\.(\d+))?$/.exec(input.trim());
  if (!m || (m[2] ?? "").length > digits) throw new Error(`Enter an amount like ${digits ? "12." + "5".padEnd(digits, "0") : "12"}`);
  return Number(m[1]) * 10 ** digits + Number((m[2] ?? "").padEnd(digits, "0") || 0);
}

export function formatMoney(minor: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 10 ** minorDigits(currency));
}
