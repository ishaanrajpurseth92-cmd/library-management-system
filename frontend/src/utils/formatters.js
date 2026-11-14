/**
 * Format date string into human-readable format e.g. "Oct 15, 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  // Parse date safely without timezone day-shift
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  return dateString;
}

/**
 * Format ISBN with standard hyphens (e.g. 978-0-13-235088-4)
 */
export function formatIsbn(isbn) {
  if (!isbn || isbn.length !== 13) return isbn;
  return `${isbn.slice(0, 3)}-${isbn.slice(3, 4)}-${isbn.slice(4, 7)}-${isbn.slice(7, 12)}-${isbn.slice(12)}`;
}

/**
 * Calculate relative overdue text
 */
export function getOverdueText(daysOverdue) {
  if (!daysOverdue || daysOverdue <= 0) return null;
  return daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`;
}
