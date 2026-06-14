/** Client-safe dev performance flags (set via `pnpm dev:fast`). */
export const isDevFastMode =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_VALEN_DEV_FAST === '1';

/** How long React Query serves cached API data before refetching. */
export const queryStaleTimeMs = isDevFastMode ? 120_000 : 30_000;

/** Keep unused query data in memory (faster back-navigation). */
export const queryGcTimeMs = isDevFastMode ? 600_000 : 300_000;

/** Dashboard summary can stay warm longer — Render round-trips dominate tab switches. */
export const dashboardSummaryStaleTimeMs = isDevFastMode ? 180_000 : 15_000;

const ME_CACHE_KEY = 'valen:me:cache';
const ME_CACHE_TTL_MS = 120_000;

export function readCachedMe<T>(): T | null {
  if (!isDevFastMode || typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (Date.now() - parsed.at > ME_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCachedMe<T>(data: T): void {
  if (!isDevFastMode || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ME_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore quota */
  }
}

export function clearCachedMe(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ME_CACHE_KEY);
}
