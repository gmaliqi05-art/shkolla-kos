/**
 * Generates a cryptographically secure random password.
 * Format: 7 alphanumeric chars + 1 special char + 1 digit
 */
export function generateSecurePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const special = '!@#$';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  const pwd = Array.from(arr).map((n) => chars[n % chars.length]).join('');
  return pwd.slice(0, 7) + special[arr[0] % special.length] + ((arr[1] % 9) + 1);
}

/**
 * Formats a date string to Albanian locale format (dd.MM.yyyy)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Returns initials from a full name (max 2 chars)
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}
