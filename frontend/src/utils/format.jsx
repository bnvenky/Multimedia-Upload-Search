const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export const formatBytes = (bytes, decimals = 1) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(decimals).replace(/\.0$/, '')} ${BYTE_UNITS[exponent]}`;
};

/** 75 -> "1:15", 3725 -> "1:02:05" */
export const formatDuration = (totalSeconds) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '';
  const seconds = Math.round(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
};

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export const formatCount = (value) => compactNumber.format(value ?? 0);

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const RELATIVE_STEPS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export const formatRelativeTime = (date, now = Date.now()) => {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000);
  const step = RELATIVE_STEPS.find(([, unitSeconds]) => Math.abs(seconds) >= unitSeconds);
  return step ? relativeTime.format(Math.round(seconds / step[1]), step[0]) : 'just now';
};

const dateTime = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export const formatDateTime = (date) => dateTime.format(new Date(date));

export const formatPercent = (value) => `${Math.round((value ?? 0) * 100)}%`;
