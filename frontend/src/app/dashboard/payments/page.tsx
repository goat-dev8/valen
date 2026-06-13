'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { PageHeader } from '@/components/app/page-header';
import { ChainBadge } from '@/components/app/chain-badge';
import { BudgetMeter } from '@/components/app/budget-meter';
import { useAgents, useMandates, useX402Execute, useX402Initiate } from '@/hooks/use-valen-api';
import { explorerTxUrl } from '@/lib/explorer';
import { mandateMatchesIntent } from '@/lib/mandate-match';
import { formatApiErrorMessage } from '@/lib/utils';

export default function PaymentsPage() {
  const { wallets } = useWallets();
  const connectedWallet = wallets[0]?.address;
  const { data: agents } = useAgents({ limit: 100, status: 'active' });
  const { data: mandates } = useMandates();
  const x402Initiate = useX402Initiate();
  const x402Execute = useX402Execute();

  const [agentId, setAgentId] = useState('');
  const [recipient, setRecipient] = useState(connectedWallet ?? '');
  const [amount, setAmount] = useState('0.01');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [settlementTx, setSettlementTx] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAgent = agents?.items.find((agent) => agent.id === agentId) ?? agents?.items[0];
  const selectedMandate = useMemo(
    () =>
      (mandates ?? []).find((mandate) =>
        mandateMatchesIntent({
          mandate,
          agentId: selectedAgent?.id,
          chainId: 421614,
          actionType: 'transfer',
          templateId: 'usdc-agent-payment',
          targetAddress: recipient,
          assetAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        }),
      ),
    [mandates, recipient, selectedAgent?.id],
  );

  const handleInitiate = async () => {
    setError(null);
    setStatusMessage(null);
    setSettlementTx(null);
    if (!selectedAgent || !selectedMandate) {
      setError('Select an active agent with a matching USDC mandate.');
      return;
    }
    try {
      const result = await x402Initiate.mutateAsync({
        agentId: selectedAgent.id,
        mandateId: selectedMandate.id,
        recipient,
        amount,
        chainId: 421614,
        merchantUrl: 'https://valenai.vercel.app/dashboard/payments',
      });
      setPaymentId(result.paymentId);
      setStatusMessage(`Payment initiated · status ${result.status}`);
    } catch (initiateError) {
      setError(formatApiErrorMessage(initiateError));
    }
  };

  const handleExecute = async () => {
    if (!paymentId) return;
    setError(null);
    setStatusMessage(null);
    try {
      const result = await x402Execute.mutateAsync(paymentId);
      setSettlementTx(result.settlementTx ?? null);
      setStatusMessage(
        `Settlement ${result.status}${result.settlementTx ? ` · tx ${result.settlementTx.slice(0, 10)}…` : ''}`,
      );
    } catch (executeError) {
      setError(formatApiErrorMessage(executeError));
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Mission Control
      </Link>

      <PageHeader
        title="x402 USDC Payments"
        description="Initiate governed x402 payments with budget enforcement, settle on-chain, and open the public payment proof."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="app-card space-y-4">
          <div className="rounded-2xl border border-[#e8f4ff] bg-[#f8fbff] p-4 text-sm leading-6 text-[#64748b]">
            x402 is VALEN&apos;s HTTP-native payment rail. Use this sandbox to initiate a payment intent, execute EIP-3009
            settlement on Arbitrum Sepolia, and share the resulting proof URL.
          </div>

          <div className="app-form-group">
            <label htmlFor="agent">Agent</label>
            <select
              id="agent"
              className="app-input"
              value={selectedAgent?.id ?? agentId}
              onChange={(event) => setAgentId(event.target.value)}
            >
              {(agents?.items ?? []).map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div className="app-form-group">
            <label htmlFor="recipient">Recipient</label>
            <input
              id="recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="0x..."
              className="app-input font-mono text-sm"
            />
          </div>

          <div className="app-form-group">
            <label htmlFor="amount">Amount (USDC)</label>
            <input
              id="amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="app-input"
            />
            <p className="mt-1 text-xs text-[#64748b]">Human-readable USDC amount (e.g. 0.01, 1, 5).</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="app-btn app-btn-outline"
              disabled={!selectedAgent || !selectedMandate || x402Initiate.isPending}
              onClick={handleInitiate}
            >
              {x402Initiate.isPending ? 'Initiating…' : 'Initiate x402 payment'}
            </button>
            <button
              type="button"
              className="app-btn app-btn-primary"
              disabled={!paymentId || x402Execute.isPending}
              onClick={handleExecute}
            >
              {x402Execute.isPending ? 'Settling…' : 'Execute settlement'}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {statusMessage && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle className="mb-2 h-5 w-5" />
              {statusMessage}
            </div>
          )}

          {paymentId && (
            <div className="rounded-2xl border border-[#eef0f3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">Proof</p>
              <Link href={`/proofs/payments/${paymentId}`} className="app-link mt-2 inline-flex items-center gap-1 text-sm">
                Open public payment proof
                <ExternalLink className="h-4 w-4" />
              </Link>
              {settlementTx && (
                <a
                  href={explorerTxUrl(421614, settlementTx)}
                  target="_blank"
                  rel="noreferrer"
                  className="app-link mt-2 block text-sm"
                >
                  View settlement on Arbiscan
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="app-card">
            <h3 className="app-card-title">Readiness</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <strong>Agent:</strong> {selectedAgent?.name ?? 'None'}
              </p>
              <p>
                <strong>Chain:</strong> <ChainBadge chainId={421614} />
              </p>
              <p>
                <strong>Mandate:</strong>{' '}
                {selectedMandate ? (
                  <span className="font-mono text-xs">{selectedMandate.id.slice(0, 8)}…</span>
                ) : (
                  'No matching USDC mandate'
                )}
              </p>
            </div>
          </div>

          <div className="app-card">
            <h3 className="app-card-title">Live USDC Budget</h3>
            <div className="mt-4">
              <BudgetMeter agentId={selectedAgent?.id} showTopup chainId={421614} />
            </div>
          </div>

          <div className="app-card">
            <h3 className="app-card-title">Refusal path</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              Exceed the agent budget or use an invalid mandate to produce a governed x402 refusal with proof. Budget
              refusals are recorded before settlement is attempted.
            </p>
            <Link href="/dashboard/executions/new" className="app-link mt-3 inline-block text-sm">
              Run governed transfer refusal demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
