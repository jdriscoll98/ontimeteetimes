import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const suffix = Number(hours) >= 12 ? 'PM' : 'AM';
  const hour = Number(hours) % 12 || 12;
  return `${hour}:${minutes} ${suffix}`;
}

export function getCurrentDateInTimezone(timezone: string): string {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat([], options);
  const parts = formatter.formatToParts(date);

  let dateObject: { [key: string]: string } = {};
  parts.forEach(({ type, value }) => {
    dateObject[type] = value;
  });

  return `${dateObject.year}-${dateObject.month}-${dateObject.day} ${dateObject.hour}:${dateObject.minute}:${dateObject.second}`;
}

