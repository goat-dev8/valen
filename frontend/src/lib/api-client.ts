import type { ApiError } from '@/types/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | undefined>;
};

const RENDER_API_URL = 'https://valen-api-m3g4.onrender.com';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api-proxy';
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? RENDER_API_URL;
  if (!apiUrl.startsWith(RENDER_API_URL)) {
    throw new ApiClientError(`Frontend API URL must target Render API (${RENDER_API_URL})`, 500, 'INVALID_API_URL');
  }
  return apiUrl;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalized}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return typeof window !== 'undefined' ? `${url.pathname}${url.search}` : url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = data as ApiError;
    throw new ApiClientError(
      err.message ?? `Request failed (${response.status})`,
      response.status,
      err.code,
      err.details,
    );
  }

  return data as T;
}

export async function apiRequestOrNull<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
