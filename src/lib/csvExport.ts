function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CSVColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function exportToCSV<T>(filename: string, columns: CSVColumn<T>[], rows: T[]): void {
  const headerRow = columns.map((c) => escapeCSV(c.header)).join(',');
  const dataRows = rows.map((row) =>
    columns.map((c) => escapeCSV(c.value(row))).join(',')
  );
  const csv = [headerRow, ...dataRows].join('\r\n');

  // BOM për Excel të hapë me UTF-8 (shkronjat shqipe ë, ç)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function csvDateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
