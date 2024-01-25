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