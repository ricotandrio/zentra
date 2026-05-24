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
