const LOCALE = 'sq-AL';

export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE);
}

export function formatDateLong(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE) + ' ' + d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

export function formatTime(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

export function formatDayMonth(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatRelative(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const isoD = d.toISOString().split('T')[0];
  const isoToday = today.toISOString().split('T')[0];
  const isoYesterday = yesterday.toISOString().split('T')[0];
  if (isoD === isoToday) return 'Sot';
  if (isoD === isoYesterday) return 'Dje';
  return formatDate(d);
}

export function toDateString(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}
