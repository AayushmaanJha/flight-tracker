/**
 * Extracts IATA flight codes from raw text (e.g. PDF content).
 * Matches patterns like AA123, U2 1234, 6E-543, BA 12, AI 0863, etc.
 *
 * PDF text extraction often produces inconsistent spacing, merged words,
 * or extra separators — the regex is intentionally permissive to handle this.
 */
export function extractFlightCodes(text: string): string[] {
  // Airline designator: 2 uppercase letters, letter+digit, or digit+letter
  // Separator: optional whitespace, hyphens, or slashes between designator and number
  // Flight number: 1–4 digits (leading zeros are stripped)
  //
  // Uses lookaround instead of \b because PDF-extracted text often lacks
  // clean word boundaries (words run together, newlines replace spaces, etc.)
  const pattern =
    /(?<![A-Za-z0-9])([A-Z]{2}|[A-Z]\d|\d[A-Z])[\s\-/]*(\d{1,4})(?!\d)/gi;

  const codes = new Set<string>();

  // Digit + time-unit letter designators are durations, not airlines
  // e.g. "2h 19m" → designator "2H" is really "2 hours", not airline 2H
  const timeUnits = new Set(["H", "M", "S", "D"]);

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const designator = match[1].toUpperCase();
    const raw = match[2];

    // Filter: "2h", "3m" etc. are durations, not airline designators
    if (/^\d/.test(designator) && timeUnits.has(designator[1])) continue;

    // Strip leading zeros: "0863" → "863"
    const number = raw.replace(/^0+/, "");
    if (!number) continue; // all zeros

    // Filter out year-like 4-digit numbers (1990–2099)
    if (raw.length === 4 && /^(19|20)\d{2}$/.test(raw)) continue;

    codes.add(`${designator}${number}`);
  }

  return Array.from(codes);
}
