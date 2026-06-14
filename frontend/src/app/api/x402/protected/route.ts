import { NextRequest, NextResponse } from 'next/server';
import {
  buildPaymentChallenge,
  buildProtectedMerchantUrl,
  buildProtectedResourcePayload,
  usdcAmountToBaseUnits,
  verifySettledPaymentForResource,
  X402_PROTECTED_AMOUNT,
  X402_PROTECTED_RESOURCE_PATH,
  resolveBackendApiBase,
} from '@/lib/x402-protected-resource';

function requestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

function readPaymentId(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get('paymentId');
  if (fromQuery) return fromQuery;
  return (
    request.headers.get('x-payment-id') ??
    request.headers.get('x-payment') ??
    request.headers.get('payment-id')
  );
}

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const merchantUrl = buildProtectedMerchantUrl(origin);
  const recipient = request.nextUrl.searchParams.get('recipient');
  const paymentId = readPaymentId(request);

  if (paymentId) {
    const verification = await verifySettledPaymentForResource({
      paymentId,
      apiBase: resolveBackendApiBase(),
      expectedAmountBase: usdcAmountToBaseUnits(X402_PROTECTED_AMOUNT),
      expectedRecipient: recipient ?? undefined,
      expectedMerchantUrl: merchantUrl,
    });

    if (!verification.ok) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          message: verification.reason,
          paymentId,
          resource: merchantUrl,
          retryWith: `${X402_PROTECTED_RESOURCE_PATH}?paymentId=${paymentId}`,
        },
        {
          status: 402,
          headers: {
            'X-VALEN-X402': 'payment-required',
            'X-Payment-Required': 'true',
          },
        },
      );
    }

    const payload = buildProtectedResourcePayload({
      origin,
      payment: verification.payment,
      proof: verification.proof,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'X-VALEN-X402': 'access-granted',
        'X-Payment-Id': verification.payment.paymentId,
        'X-Proof-Url': payload.proofUrl,
      },
    });
  }

  if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    return NextResponse.json(
      {
        error: 'Payment Required',
        message: 'Provide recipient=0x… query parameter to receive x402 payment requirements.',
        resource: merchantUrl,
      },
      {
        status: 402,
        headers: {
          'X-VALEN-X402': 'payment-required',
          'X-Payment-Required': 'true',
        },
      },
    );
  }

  const challenge = buildPaymentChallenge({ origin, recipient });

  return NextResponse.json(challenge, {
    status: 402,
    headers: {
      'X-VALEN-X402': 'payment-required',
      'X-Payment-Required': 'true',
      'X-Payment-Amount': X402_PROTECTED_AMOUNT,
      'X-Payment-Asset': 'USDC',
      'X-Payment-Recipient': recipient,
    },
  });
}
