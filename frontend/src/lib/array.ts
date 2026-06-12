import type { PaginatedResult } from '@/types/api';

export function asArray<T>(data: T[] | PaginatedResult<T> | null | undefined | unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null && 'items' in data) {
    const items = (data as PaginatedResult<T>).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
}
