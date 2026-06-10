import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
const OPERATOR_KEY = process.env.OPERATOR_DASHBOARD_SECRET ?? '';

async function proxy(request: NextRequest, path: string) {
  if (!OPERATOR_KEY) {
    return Response.json(
      { message: 'OPERATOR_DASHBOARD_SECRET is not configured in frontend env' },
      { status: 500 },
    );
  }

  const url = new URL(`${BACKEND_URL}/v1/operator/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'x-operator-key': OPERATOR_KEY,
    },
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const response = await fetch(url, init);
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path.join('/'));
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path.join('/'));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path.join('/'));
}
