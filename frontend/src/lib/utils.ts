import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(value?: string | number | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}
