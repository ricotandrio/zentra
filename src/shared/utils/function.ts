import { Utc } from './map';

/**
 * Utility functions for cron schedule adjustments.
 * 
 * Default of cron schedule is in UTC+0.
 * This function converts a cron schedule from one UTC offset to another.
 * 
 * @example
 * const cronSchedule = '0 18 * * *'; // 6 PM UTC+0
 * const convertedSchedule = convertCronScheduleHour(cronSchedule, Utc.UTC0, Utc.UTC7);
 * 
 * @param cronSchedule - The original cron schedule string (e.g., '0 18 * * *')
 * @param from - The original UTC offset of the cron schedule (default: Utc.UTC0)
 * @param to - The target UTC offset to convert the cron schedule to
 * @returns The converted cron schedule string adjusted for the target UTC offset
 */
export const convertCronScheduleHour = (
  cronSchedule: string, 
  from: Utc = Utc.UTC0,
  to: Utc
): string => {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronSchedule.split(' ');
  
  if (hour && hour !== '*') {
    const hourInt = parseInt(hour);
    const hourDiff = (to - from + 24) % 24;
    const convertedHour = (hourInt + hourDiff) % 24;
    return `${minute} ${convertedHour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }

  return cronSchedule; // If hour is '*', return as is since it runs every hour
};

/** * Converts an ISO date string to a localized date string in Indonesian format.
 * 
 * @param isoDate - The ISO date string to convert (e.g., '2024-06-01T12:00:00Z')
 * @returns A localized date string formatted for Indonesian locale (e.g., '01 Jun 2024, 19:00:00')
 */
export const isoDateToLocaleString = (isoDate: string): string => {
  if (!isoDate) return 'Invalid date';
  
  const date = new Date(isoDate);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
