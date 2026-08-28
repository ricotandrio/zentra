export function formatAsMarkdownTable(
  columns: string[],
  rows: Record<string, unknown>[],
  maxRows: number = 10
): string {
  if (columns.length === 0) return 'No data returned.';

  const truncated = rows.slice(0, maxRows);
  const truncatedCount = rows.length > maxRows ? rows.length - maxRows : 0;

  const colWidths = columns.map((col) => {
    const dataWidths = truncated.map((row) => String(row[col] ?? '').length);
    return Math.max(col.length, ...dataWidths);
  });

  const header = `| ${columns.map((col, i) => col.padEnd(colWidths[i]!)).join(' | ')} |`;
  const separator = `| ${colWidths.map((w) => '-'.repeat(w)).join(' | ')} |`;
  const dataRows = truncated.map(
    (row) =>
      `| ${columns.map((col, i) => String(row[col] ?? '').padEnd(colWidths[i]!)).join(' | ')} |`
  );

  const lines = [header, separator, ...dataRows];

  if (truncatedCount > 0) {
    lines.push(`\n*...and ${truncatedCount} more rows (showing ${maxRows} of ${rows.length})*`);
  }

  return lines.join('\n');
}
