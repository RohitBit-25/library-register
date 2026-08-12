/**
 * CSV serialisation with quote escaping and formula-injection protection.
 *
 * Both matter here because member and request names come from the *public*
 * seat-request form. Before this:
 *   - a name containing `"` broke the row apart (values were wrapped in bare
 *     quotes with no doubling);
 *   - a name starting with `=`, `+`, `-`, or `@` was executed as a formula when
 *     the admin opened the file in Excel or Sheets.
 */

/** Leading characters a spreadsheet treats as the start of a formula. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  let s = String(value);

  // Neutralise formulas by prefixing an apostrophe, which spreadsheets treat
  // as "this is text".
  const neutralised = FORMULA_PREFIX.test(s);
  if (neutralised) s = `'${s}`;

  // RFC 4180: double any embedded quote, then wrap if the value contains a
  // quote, comma, or newline. Neutralised values are always wrapped too —
  // quoting is uniform across parsers, unquoted leading punctuation is not.
  if (neutralised || /["\n\r,]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsvValue).join(',');
}

/** Build a full CSV document from a header row and data rows. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [toCsvRow(headers), ...rows.map(toCsvRow)].join('\r\n');
}
