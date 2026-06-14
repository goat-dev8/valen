'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lock,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { X402PaymentConfig } from '@/components/payments/x402-payment-config';
import { useX402PaymentFlow } from '@/hooks/use-x402-payment-flow';
import { explorerTxUrl } from '@/lib/explorer';
import {
  X402_PROTECTED_AMOUNT,
  X402_PROTECTED_MERCHANT_URL_FALLBACK,
  X402_PROTECTED_RESOURCE_PATH,
  type X402PaymentChallenge,
  type X402ProtectedResourcePayload,
} from '@/lib/x402-protected-resource';
import { X402_CHAIN_ID } from '@/lib/x402-constants';

type HttpTrace = {
  label: string;
  status: number;
  body: unknown;
  url: string;
};

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-2xl border border-[#E8ECF0] bg-[#0b1220] p-4 text-xs leading-6 text-[#dbeafe]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function StepCard({
  step,
  title,
  active,
  complete,
  children,
}: {
  step: number;
  title: string;
  active: boolean;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl border p-5 ${
        active ? 'border-[#0066FF] bg-[#f8fbff]' : complete ? 'border-emerald-200 bg-emerald-50/40' : 'border-[#E8ECF0] bg-white'
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
            complete ? 'bg-emerald-600 text-white' : active ? 'bg-[#0066FF] text-white' : 'bg-[#E8ECF0] text-[#64748b]'
          }`}
        >
          {complete ? <CheckCircle2 className="h-5 w-5" /> : step}
        </span>
        <h2 className="text-lg font-semibold text-[#012b54]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function X402ProtectedDemoPage() {
  const [merchantUrl, setMerchantUrl] = useState(X402_PROTECTED_MERCHANT_URL_FALLBACK);

  useEffect(() => {
    setMerchantUrl(`${window.location.origin}${X402_PROTECTED_RESOURCE_PATH}`);
  }, []);

  const flow = useX402PaymentFlow(X402_PROTECTED_AMOUNT, { merchantUrl });
  const [challengeTrace, setChallengeTrace] = useState<HttpTrace | null>(null);
  const [unlockTrace, setUnlockTrace] = useState<HttpTrace | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const stepComplete = useMemo(
    () => ({
      request: Boolean(challengeTrace?.status === 402),
      challenge: Boolean(challengeTrace?.status === 402),
      pay: Boolean(flow.paymentId),
      settle: Boolean(flow.settlementTx),
      unlock: Boolean(unlockTrace?.status === 200),
    }),
    [challengeTrace, flow.paymentId, flow.settlementTx, unlockTrace],
  );

  const activeStep = stepComplete.unlock
    ? 5
    : stepComplete.settle
      ? 4
      : stepComplete.pay
        ? 3
        : stepComplete.challenge
          ? 2
          : 1;

  const requestResource = async () => {
    setFlowError(null);
    if (!/^0x[a-fA-F0-9]{40}$/.test(flow.recipient)) {
      setFlowError('Enter a valid recipient wallet before requesting the protected resource.');
      return;
    }
    setIsRequesting(true);
    try {
      const url = `${X402_PROTECTED_RESOURCE_PATH}?recipient=${encodeURIComponent(flow.recipient)}`;
      const response = await fetch(url, { cache: 'no-store' });
      const body = await response.json();
      setChallengeTrace({ label: 'GET /api/x402/protected', status: response.status, body, url });
      if (response.status !== 402) {
        setFlowError(`Expected HTTP 402, received ${response.status}.`);
      }
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : 'Protected resource request failed');
    } finally {
      setIsRequesting(false);
    }
  };

  const unlockResource = async () => {
    if (!flow.paymentId) return;
    setFlowError(null);
    setIsUnlocking(true);
    try {
      const url = `${X402_PROTECTED_RESOURCE_PATH}?recipient=${encodeURIComponent(flow.recipient)}&paymentId=${encodeURIComponent(flow.paymentId)}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'X-Payment-Id': flow.paymentId },
      });
      const body = await response.json();
      setUnlockTrace({ label: 'GET /api/x402/protected?paymentId=…', status: response.status, body, url });
      if (response.status !== 200) {
        setFlowError(`Expected HTTP 200, received ${response.status}.`);
      }
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : 'Resource unlock failed');
    } finally {
      setIsUnlocking(false);
    }
  };

  const challenge = challengeTrace?.body as X402PaymentChallenge | undefined;
  const unlocked = unlockTrace?.body as X402ProtectedResourcePayload | undefined;
  const proofPath = flow.paymentId ? `/proofs/payments/${flow.paymentId}` : null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="app-back-link">
        Command Center
      </Link>

      <PageHeader
        title="Protected Resource Demo"
        description="Complete x402 proof-of-payment flow: HTTP 402 challenge → VALEN agent payment → settlement → public proof → HTTP 200 resource."
      >
        <ChainBadge chainId={X402_CHAIN_ID} />
      </PageHeader>

      <section className="rounded-3xl border border-[#E8ECF0] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066FF]">Judge evidence</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
          {[
            'HTTP Request',
            '402 Payment Required',
            'VALEN Agent Payment',
            'On-chain Settlement',
            'Proof Generated',
            '200 OK Resource Returned',
          ].flatMap((label, index, arr) => {
            const nodes = [
              <div key={label} className="rounded-2xl border border-[#E8ECF0] bg-[#FAFBFC] p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Step {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-[#012b54]">{label}</p>
              </div>,
            ];
            if (index < arr.length - 1) {
              nodes.push(
                <div key={`${label}-arrow`} className="hidden justify-center md:flex">
                  <ArrowDown className="h-5 w-5 rotate-[-90deg] text-[#94a3b8]" />
                </div>,
              );
            }
            return nodes;
          })}
        </div>
      </section>

      {flowError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{flowError}</div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <StepCard step={1} title="Request resource" active={activeStep === 1} complete={stepComplete.request}>
            <p className="mb-4 text-sm leading-6 text-[#64748b]">
              Call the protected endpoint without payment proof. The server must answer with real HTTP 402 and x402 payment metadata.
            </p>
            <button type="button" className="app-btn app-btn-primary" disabled={isRequesting} onClick={() => void requestResource()}>
              {isRequesting ? 'Requesting…' : 'GET /api/x402/protected'}
            </button>
          </StepCard>

          <StepCard step={2} title="402 payment required" active={activeStep === 2} complete={stepComplete.challenge}>
            {challengeTrace ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#012b54]">
                  HTTP {challengeTrace.status} · {challenge?.accepts?.[0]?.assetSymbol ?? 'USDC'}{' '}
                  {X402_PROTECTED_AMOUNT}
                </p>
                <JsonBlock value={challengeTrace.body} />
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">Run step 1 to capture the live 402 challenge response.</p>
            )}
          </StepCard>

          <StepCard step={3} title="Pay with VALEN agent" active={activeStep === 3} complete={stepComplete.pay}>
            <div className="space-y-4">
              <X402PaymentConfig
                agents={flow.agents}
                matchingAgentIds={flow.matchingAgentIds}
                agentId={flow.agentId}
                onAgentSelect={flow.setAgentId}
                amount={flow.amount}
                onAmountChange={flow.setAmount}
                recipient={flow.recipient}
                onRecipientChange={flow.setRecipient}
                onUseMyWallet={flow.useMyWallet}
                disabled={flow.isInitiating || flow.isSettling}
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="app-btn app-btn-primary"
                  disabled={!stepComplete.challenge || flow.isInitiating || flow.isSettling}
                  onClick={() => void flow.handleInitiate()}
                >
                  {flow.isInitiating ? 'Initiating…' : 'Initiate governed payment'}
                </button>
                <button
                  type="button"
                  className="app-btn app-btn-outline"
                  disabled={!flow.paymentId || flow.isSettling || Boolean(flow.settlementTx)}
                  onClick={() => void flow.handleExecute()}
                >
                  {flow.isSettling ? 'Settling…' : 'Execute EIP-3009 settlement'}
                </button>
              </div>
              {flow.paymentId && (
                <p className="text-sm text-[#012b54]">
                  Payment ID: <code className="break-all">{flow.paymentId}</code>
                </p>
              )}
            </div>
          </StepCard>

          <StepCard step={4} title="Settlement complete" active={activeStep === 4} complete={stepComplete.settle}>
            {flow.settlementTx ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-700">On-chain settlement confirmed.</p>
                <dl className="app-detail-list">
                  <div>
                    <dt>Settlement TX</dt>
                    <dd className="break-all font-mono text-xs">
                      <a
                        href={explorerTxUrl(X402_CHAIN_ID, flow.settlementTx)}
                        target="_blank"
                        rel="noreferrer"
                        className="app-link inline-flex items-center gap-1"
                      >
                        {flow.settlementTx}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </dd>
                  </div>
                  {proofPath && (
                    <div>
                      <dt>Proof URL</dt>
                      <dd>
                        <Link href={proofPath} className="app-link">
                          {proofPath}
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>
                <button type="button" className="app-btn app-btn-primary" disabled={isUnlocking} onClick={() => void unlockResource()}>
                  {isUnlocking ? 'Unlocking…' : 'Retry protected resource with payment proof'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">Complete governed settlement to unlock the protected resource.</p>
            )}
          </StepCard>

          <StepCard step={5} title="Resource unlocked" active={activeStep === 5} complete={stepComplete.unlock}>
            {unlockTrace ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Unlock className="h-5 w-5" />
                  <p className="font-semibold">HTTP {unlockTrace.status} OK · Access granted</p>
                </div>
                <JsonBlock value={unlockTrace.body} />
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">After settlement verification, the protected endpoint returns HTTP 200 and the resource payload.</p>
            )}
          </StepCard>
        </div>

        <aside className="space-y-5">
          <div className="app-card">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#0066FF]" />
              <h3 className="app-card-title">Live HTTP trace</h3>
            </div>
            <dl className="app-detail-list mt-4">
              <div>
                <dt>Protected endpoint</dt>
                <dd className="font-mono text-xs">{X402_PROTECTED_RESOURCE_PATH}</dd>
              </div>
              <div>
                <dt>Challenge status</dt>
                <dd>{challengeTrace?.status ?? '—'}</dd>
              </div>
              <div>
                <dt>Unlock status</dt>
                <dd>{unlockTrace?.status ?? '—'}</dd>
              </div>
              <div>
                <dt>Payment ID</dt>
                <dd className="break-all font-mono text-xs">{flow.paymentId ?? '—'}</dd>
              </div>
              <div>
                <dt>Settlement TX</dt>
                <dd className="break-all font-mono text-xs">{flow.settlementTx ?? '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="app-card">
            <h3 className="app-card-title">Quick links</h3>
            <div className="mt-4 flex flex-col gap-3">
              {proofPath && (
                <Link href={proofPath} className="app-btn app-btn-outline">
                  Open public proof
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <Link href="/dashboard/payments" className="app-btn app-btn-outline">
                x402 Payments dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="app-btn app-btn-outline"
                onClick={() => {
                  flow.resetFlow();
                  setChallengeTrace(null);
                  setUnlockTrace(null);
                  setFlowError(null);
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Reset demo
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
