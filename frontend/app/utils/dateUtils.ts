/**
 * Utility functions for formatting dates and times
 * Default timezone: UTC+8 (Singapore/Hong Kong/Beijing)
 */

/**
 * Get timezone offset in hours from stored settings or default to UTC+8
 */
export function getTimezoneOffset(): number {
  try {
    const settings = localStorage.getItem("appSettings");
    if (settings) {
      const parsed = JSON.parse(settings);
      const timezone = parsed.timezone || "UTC+8";
      // Parse timezone string (e.g., "UTC+8", "UTC-5", "UTC+5:30")
      const match = timezone.match(/UTC([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1] === "+" ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours + minutes / 60);
      }
    }
  } catch (error) {
    console.error("Failed to parse timezone settings:", error);
  }
  return 8; // Default to UTC+8
}

/**
 * Convert a date to the user's configured timezone
 */
export function toUserTimezone(date: Date): Date {
  const offset = getTimezoneOffset();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + offset * 3600000);
}

/**
 * Format a date string to relative time (e.g., "2 mins ago", "1 hour ago")
 * Uses user's configured timezone
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Format a date string to full date and time (e.g., "Jan 15, 2025, 10:30 AM")
 * Uses user's configured timezone
 */
export function formatFullDateTime(dateString: string): string {
  const date = toUserTimezone(new Date(dateString));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // We already adjusted to user timezone
  }).format(date);
}

/**
 * Format a date string to time only (e.g., "10:30 AM")
 * Uses user's configured timezone
 */
export function formatTimeOnly(dateString: string): string {
  const date = toUserTimezone(new Date(dateString));
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // We already adjusted to user timezone
  }).format(date);
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(dateString: string): boolean {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}
