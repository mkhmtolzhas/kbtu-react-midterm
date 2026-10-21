const tengeFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatTenge(amount) {
  return `${tengeFormatter.format(amount)} ₸`;
}

export function formatKm(km) {
  return `${numberFormatter.format(km)} km`;
}

export function formatDate(isoDate) {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

export function formatDateTime(isoDateTime) {
  return dateTimeFormatter.format(new Date(isoDateTime));
}

export function formatDaysAgo(days) {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${numberFormatter.format(count)} ${count === 1 ? singular : plural}`;
}
