import { X402_CHAIN_ID, X402_USDC_ADDRESS } from '@/lib/x402-constants';

export const X402_PROTECTED_RESOURCE_PATH = '/api/x402/protected';
export const X402_PROTECTED_AMOUNT = '1';
export const X402_PROTECTED_ASSET_SYMBOL = 'USDC';
export const X402_PROTECTED_MERCHANT_URL_FALLBACK = 'https://valenai.vercel.app/api/x402/protected';

const RENDER_API_URL = 'https://valen-api-m3g4.onrender.com';

export type X402PaymentChallenge = {
  x402Version: 1;
  error: 'Payment Required';
  accepts: Array<{
    scheme: 'exact';
    network: `eip155:${number}`;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: string;
    asset: string;
    assetSymbol: string;
    extra: {
      name: string;
      version: string;
      paymentFlow: 'valen-governed-x402';
      valenMerchantPath: string;
    };
  }>;
};

export type X402ProtectedResourcePayload = {
  resource: 'valen-protected-demo';
  title: string;
  summary: string;
  content: string;
  accessGrantedAt: string;
  paymentId: string;
  proofUrl: string;
  settlementTx: string;
  evidenceHash: string;
  mandateVerified: boolean;
  httpStatus: 200;
};

export type PublicPaymentRecord = {
  paymentId: string;
  agentId?: string;
  chainId?: number;
  merchantUrl?: string | null;
  recipient?: string;
  assetSymbol?: string;
  amount?: string;
  status: string;
  evidenceHash?: string | null;
  settlementTx?: string | null;
  proofUrl?: string;
};

export type PublicProofRecord = {
  id: string;
  kind: string;
  action?: string;
  status: string;
  mandateHash?: string | null;
  settlementTx?: string | null;
  evidenceHash?: string | null;
  agentId?: string;
};

export function resolveBackendApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.BACKEND_URL ??
    RENDER_API_URL
  ).replace(/\/$/, '');
}

export function usdcAmountToBaseUnits(amount: string): string {
  const normalized = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error('Invalid USDC amount');
  }
  const [whole, fraction = ''] = normalized.split('.');
  const paddedFraction = `${fraction}000000`.slice(0, 6);
  const scale = BigInt(1_000_000);
  return (BigInt(whole || '0') * scale + BigInt(paddedFraction || '0')).toString();
}

export function buildProtectedMerchantUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}${X402_PROTECTED_RESOURCE_PATH}`;
}

export function buildPaymentChallenge(input: {
  origin: string;
  recipient: string;
}): X402PaymentChallenge {
  const resource = buildProtectedMerchantUrl(input.origin);
  return {
    x402Version: 1,
    error: 'Payment Required',
    accepts: [
      {
        scheme: 'exact',
        network: `eip155:${X402_CHAIN_ID}`,
        maxAmountRequired: usdcAmountToBaseUnits(X402_PROTECTED_AMOUNT),
        resource,
        description: 'Access governed VALEN protected research brief via x402 USDC payment',
        mimeType: 'application/json',
        payTo: input.recipient,
        asset: X402_USDC_ADDRESS,
        assetSymbol: X402_PROTECTED_ASSET_SYMBOL,
        extra: {
          name: 'USD Coin',
          version: '2',
          paymentFlow: 'valen-governed-x402',
          valenMerchantPath: X402_PROTECTED_RESOURCE_PATH,
        },
      },
    ],
  };
}

export function buildProtectedResourcePayload(input: {
  origin: string;
  payment: PublicPaymentRecord;
  proof: PublicProofRecord;
}): X402ProtectedResourcePayload {
  const proofUrl = `${input.origin.replace(/\/$/, '')}${input.payment.proofUrl ?? `/proofs/payments/${input.payment.paymentId}`}`;
  return {
    resource: 'valen-protected-demo',
    title: 'Governed Research Brief',
    summary: 'Premium agent-readable market signal unlocked after x402 settlement.',
    content:
      'VALEN verified this request after governed agent payment, mandate-backed initiation, EIP-3009 settlement, and public proof publication.',
    accessGrantedAt: new Date().toISOString(),
    paymentId: input.payment.paymentId,
    proofUrl,
    settlementTx: input.payment.settlementTx ?? '',
    evidenceHash: input.payment.evidenceHash ?? '',
    mandateVerified: Boolean(input.payment.agentId && input.proof.agentId),
    httpStatus: 200,
  };
}

export async function verifySettledPaymentForResource(input: {
  paymentId: string;
  apiBase: string;
  expectedAmountBase: string;
  expectedRecipient?: string;
  expectedMerchantUrl?: string;
}): Promise<
  | { ok: true; payment: PublicPaymentRecord; proof: PublicProofRecord }
  | { ok: false; reason: string }
> {
  const paymentResponse = await fetch(`${input.apiBase}/v1/public/payments/${input.paymentId}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!paymentResponse.ok) {
    return { ok: false, reason: 'Payment record not found' };
  }
  const payment = (await paymentResponse.json()) as PublicPaymentRecord;

  if (payment.status !== 'settled') {
    return { ok: false, reason: `Payment status is ${payment.status}` };
  }
  if (!payment.settlementTx) {
    return { ok: false, reason: 'Settlement transaction missing' };
  }
  if (!payment.evidenceHash) {
    return { ok: false, reason: 'Evidence hash missing' };
  }
  if (payment.amount !== input.expectedAmountBase) {
    return { ok: false, reason: 'Payment amount does not match protected resource price' };
  }
  if (
    input.expectedRecipient &&
    payment.recipient?.toLowerCase() !== input.expectedRecipient.toLowerCase()
  ) {
    return { ok: false, reason: 'Payment recipient does not match challenge' };
  }
  if (input.expectedMerchantUrl && payment.merchantUrl) {
    const normalizedMerchant = payment.merchantUrl.replace(/\/$/, '');
    const normalizedExpected = input.expectedMerchantUrl.replace(/\/$/, '');
    if (normalizedMerchant !== normalizedExpected) {
      return { ok: false, reason: 'Payment merchant URL does not match protected resource' };
    }
  }
  if (!payment.agentId) {
    return { ok: false, reason: 'Governed agent payment required' };
  }

  const proofResponse = await fetch(`${input.apiBase}/v1/public/proofs/payments/${input.paymentId}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!proofResponse.ok) {
    return { ok: false, reason: 'Public proof record not found' };
  }
  const proof = (await proofResponse.json()) as PublicProofRecord;
  if (proof.action !== 'x402_payment' || proof.status !== 'settled') {
    return { ok: false, reason: 'Proof record is not a settled x402 payment' };
  }
  if (proof.settlementTx !== payment.settlementTx) {
    return { ok: false, reason: 'Proof settlement transaction mismatch' };
  }

  return { ok: true, payment, proof };
}
