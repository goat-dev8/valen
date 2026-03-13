import { NextResponse, type NextRequest } from 'next/server';

const RENDER_API_URL = 'https://valen-api-m3g4.onrender.com';

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function resolveBackendUrl() {
  const value =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.BACKEND_URL ??
    RENDER_API_URL;

  if (!value.startsWith(RENDER_API_URL)) {
    throw new Error(`Operator proxy must target Render API: ${RENDER_API_URL}`);
  }

  return value.replace(/\/$/, '');
}

async function proxyOperatorRequest(request: NextRequest, context: RouteContext) {
  const operatorKey = process.env.OPERATOR_DASHBOARD_SECRET;

  if (!operatorKey) {
    return NextResponse.json(
      { code: 'OPERATOR_KEY_MISSING', message: 'Operator dashboard secret is not configured.' },
      { status: 500 },
    );
  }

  const { path = [] } = await context.params;
  const upstreamUrl = new URL(`/v1/operator/${path.join('/')}`, resolveBackendUrl());
  upstreamUrl.search = request.nextUrl.search;

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();
  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      Accept: 'application/json',
      'x-operator-key': operatorKey,
      ...(body ? { 'Content-Type': request.headers.get('content-type') ?? 'application/json' } : {}),
    },
    body,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyOperatorRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyOperatorRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyOperatorRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyOperatorRequest(request, context);
}
