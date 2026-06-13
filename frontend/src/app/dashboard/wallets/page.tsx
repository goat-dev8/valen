'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Copy, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { WalletBalancesPanel } from '@/components/app/wallet-balances-panel';
import { useOrganization } from '@/contexts/org-context';
import {
  useAgents,
  useCreateMandateTypedData,
  useCreateSignedMandate,
  useCreateWalletChallenge,
  useMandates,
  usePolicies,
  useRevokeMandate,
  useVerifyWallet,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { operatorFetch } from '@/lib/api';
import { chainName } from '@/lib/constants';
import { explorerAddressUrl } from '@/lib/explorer';
import { getAddress } from 'viem';
import { prepareMandateTypedDataForSigning } from '@/lib/mandate-typed-data';
import { ensureWalletOnChain, formatWalletChainError, getWalletChainId, isWalletChainError, isWalletOnAuthorityChain, walletChainBannerMessage } from '@/lib/wallet-chain';
import { formatApiErrorMessage, normalizeEvmAddressInput } from '@/lib/utils';

const SUPPORTED_CHAIN_IDS = [421614, 46630] as const;

const SETTLEMENT_ADDRESSES: Record<number, string | undefined> = {
  421614: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_SETTLEMENT_ADDRESS,
  46630: process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_SETTLEMENT_ADDRESS,
};

type TreasuryData = {
  chainId: number;
  treasuryAddress?: string;
  nativeBalanceEth?: string;
  nativeBalanceWei?: string;
  accruedFeesWei?: string;
  collectedFeesWei?: string;
};

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

type SignableWallet = {
  address?: string;
  chainId?: unknown;
  getEthereumProvider?: () => Promise<EthereumProvider>;
};

type WalletCardProps = {
  title: string;
  subtitle: string;
  address?: string | null;
  chainId?: number | null;
  balance?: string | null;
  status: string;
  statusTone?: 'ok' | 'warn' | 'error';
  note?: string;
};

function normalizeChainId(chainId: unknown): number | null {
  if (typeof chainId === 'number') return chainId;
  if (typeof chainId === 'string') {
    const last = chainId.split(':').pop();
    const parsed = Number(last);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function shortAddress(address?: string | null) {
  if (!address) return 'Unavailable';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function trimBalance(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

async function requestPersonalSignature(wallet: SignableWallet, message: string): Promise<string> {
  if (!wallet.address || !wallet.getEthereumProvider) {
    throw new Error('Connected wallet does not expose a signing provider');
  }

  const provider = await wallet.getEthereumProvider();
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, wallet.address],
  });

  if (typeof signature !== 'string') {
    throw new Error('Wallet did not return a signature');
  }

  return signature;
}

async function requestTypedDataSignature(wallet: SignableWallet, typedData: Record<string, unknown>): Promise<string> {
  if (!wallet.address || !wallet.getEthereumProvider) {
    throw new Error('Connected wallet does not expose a signing provider');
  }

  const provider = await wallet.getEthereumProvider();
  const signature = await provider.request({
    method: 'eth_signTypedData_v4',
    params: [wallet.address, JSON.stringify(typedData)],
  });

  if (typeof signature !== 'string') {
    throw new Error('Wallet did not return a signature');
  }

  return signature;
}

function commaList(value: FormDataEntryValue | null, fallback: string[] = []) {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function WalletCard({ title, subtitle, address, chainId, balance, status, statusTone = 'ok', note }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(address);
  const explorer = address && chainId ? explorerAddressUrl(chainId, address) : null;

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="app-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#012b54]">{title}</p>
          <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p>
        </div>
        <span className={`wallet-status wallet-status-${statusTone}`}>{status}</span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="wallet-row">
          <span>Address</span>
          <code>{shortAddress(address)}</code>
        </div>
        <div className="wallet-row">
          <span>Network</span>
          {chainId ? <ChainBadge chainId={chainId} /> : <strong>Unavailable</strong>}
        </div>
        <div className="wallet-row">
          <span>Balance</span>
          <strong>{balance ?? 'Unavailable from Render API'}</strong>
        </div>
      </div>

      {note && <p className="mt-4 rounded-lg bg-[#f8fafc] p-3 text-xs leading-5 text-[#64748b]">{note}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="app-btn app-btn-outline" disabled={!canCopy} onClick={copyAddress}>
          <Copy className="h-4 w-4" />
          {copied ? 'Copied' : 'Copy'}
        </button>
        {explorer && (
          <a href={explorer} target="_blank" rel="noreferrer" className="app-btn app-btn-outline">
            <ExternalLink className="h-4 w-4" />
            Explorer
          </a>
        )}
      </div>
    </div>
  );
}

export default function WalletsPage() {
  const { wallets, ready } = useWallets();
  const { organization } = useOrganization();
  const { data: agents } = useAgents({ limit: 100 });
  const { data: policies } = usePolicies();
  const mandatesQuery = useMandates();
  const walletVerificationsQuery = useWalletVerifications();
  const challengeMutation = useCreateWalletChallenge();
  const verifyMutation = useVerifyWallet();
  const typedDataMutation = useCreateMandateTypedData();
  const createMandateMutation = useCreateSignedMandate();
  const revokeMandateMutation = useRevokeMandate();
  const [chainId, setChainId] = useState<number>(organization?.defaultChainId ?? 421614);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [isSigningMandate, setIsSigningMandate] = useState(false);
  const [liveWalletChainId, setLiveWalletChainId] = useState<number | null>(null);

  const treasuryQuery = useQuery({
    queryKey: ['operator-treasury', chainId],
    queryFn: () => operatorFetch<TreasuryData>(`treasury?chainId=${chainId}`),
  });

  const connectedWallet = wallets[0];
  const { data: walletBalances } = useWalletBalances(connectedWallet?.address);
  const arbBalance = walletBalances?.find((row) => row.chainId === 421614);
  const rhBalance = walletBalances?.find((row) => row.chainId === 46630);
  const connectedBalanceSummary = connectedWallet?.address
    ? [
        arbBalance ? `Arb ${trimBalance(arbBalance.nativeFormatted)} ETH` : null,
        arbBalance?.tokens[0] ? `${trimBalance(arbBalance.tokens[0].formatted)} ${arbBalance.tokens[0].symbol}` : null,
        rhBalance ? `RH ${trimBalance(rhBalance.nativeFormatted)} ETH` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Loading…'
    : null;
  const signableWallet = connectedWallet as SignableWallet | undefined;
  const connectedChainId = normalizeChainId(connectedWallet?.chainId);
  const authorityChainId = chainId;
  const effectiveWalletChainId = liveWalletChainId ?? connectedChainId;
  const walletNeedsChainSwitch = Boolean(
    signableWallet?.getEthereumProvider &&
      effectiveWalletChainId &&
      !isWalletOnAuthorityChain(effectiveWalletChainId, authorityChainId),
  );
  const unsupportedConnectedChain = Boolean(
    effectiveWalletChainId && !SUPPORTED_CHAIN_IDS.includes(effectiveWalletChainId as (typeof SUPPORTED_CHAIN_IDS)[number]),
  );
  const verifiedWallets = walletVerificationsQuery.data ?? [];
  const mandates = mandatesQuery.data ?? [];
  const verifiedForAuthorityChain = verifiedWallets.find(
    (wallet) =>
      wallet.status === 'verified' &&
      connectedWallet?.address &&
      wallet.walletAddress.toLowerCase() === connectedWallet.address.toLowerCase() &&
      wallet.chainId === authorityChainId,
  );

  const activeAgents = useMemo(
    () => agents?.items.filter((agent) => agent.status === 'active').length ?? 0,
    [agents],
  );
  const activeAgentOptions = useMemo(
    () => agents?.items.filter((agent) => agent.status === 'active') ?? [],
    [agents],
  );

  useEffect(() => {
    let cancelled = false;
    async function refreshWalletChain() {
      if (!signableWallet?.getEthereumProvider) {
        setLiveWalletChainId(null);
        return;
      }
      try {
        const provider = await signableWallet.getEthereumProvider();
        const chain = await getWalletChainId(provider);
        if (!cancelled) setLiveWalletChainId(chain);
      } catch {
        if (!cancelled) setLiveWalletChainId(null);
      }
    }
    void refreshWalletChain();
    return () => {
      cancelled = true;
    };
  }, [signableWallet, authorityChainId, ready]);

  useEffect(() => {
    if (!signableWallet?.getEthereumProvider || !ready) return;

    let cancelled = false;
    async function autoSwitchAuthorityChain() {
      try {
        const provider = await signableWallet!.getEthereumProvider!();
        const current = await getWalletChainId(provider);
        if (cancelled || isWalletOnAuthorityChain(current, authorityChainId)) {
          if (!cancelled) setLiveWalletChainId(current);
          return;
        }
        await ensureWalletOnChain(provider, authorityChainId);
        const updated = await getWalletChainId(provider);
        if (!cancelled) setLiveWalletChainId(updated);
      } catch {
        if (!cancelled) {
          const provider = await signableWallet?.getEthereumProvider?.();
          if (provider) {
            const current = await getWalletChainId(provider).catch(() => null);
            if (!cancelled) setLiveWalletChainId(current);
          }
        }
      }
    }

    void autoSwitchAuthorityChain();
    return () => {
      cancelled = true;
    };
  }, [authorityChainId, ready, signableWallet]);

  const ensureAuthorityChainInWallet = async () => {
    if (!signableWallet?.getEthereumProvider) {
      throw new Error('Connect a wallet before signing.');
    }
    const provider = await signableWallet.getEthereumProvider();
    await ensureWalletOnChain(provider, authorityChainId);
    const updated = await getWalletChainId(provider);
    setLiveWalletChainId(updated);
  };

  const handleSwitchWalletNetwork = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSwitchingChain(true);
    try {
      await ensureAuthorityChainInWallet();
      setActionSuccess(`Wallet switched to ${chainName(authorityChainId)}. You can now sign mandates on this network.`);
    } catch (err) {
      setActionError(formatWalletChainError(err, authorityChainId));
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const handleVerifyConnectedWallet = async () => {
    setActionError(null);
    setActionSuccess(null);

    const walletAddress = normalizeEvmAddressInput(connectedWallet?.address ?? '');
    const walletChainId = authorityChainId;
    if (!connectedWallet || !signableWallet || !walletAddress || !walletChainId) {
      setActionError('Connect a wallet before requesting verification.');
      return;
    }
    if (!SUPPORTED_CHAIN_IDS.includes(walletChainId as (typeof SUPPORTED_CHAIN_IDS)[number])) {
      setActionError('Select Arbitrum Sepolia or Robinhood Testnet before verifying.');
      return;
    }

    try {
      await ensureAuthorityChainInWallet();
      const challenge = await challengeMutation.mutateAsync({
        chainId: walletChainId,
        walletAddress,
      });
      const signature = await requestPersonalSignature(signableWallet, challenge.message);
      await verifyMutation.mutateAsync({
        chainId: walletChainId,
        walletAddress,
        signature,
      });
      setActionSuccess('Wallet ownership verified. This signature did not authorize a transaction.');
    } catch (err) {
      setActionError(
        isWalletChainError(err)
          ? formatWalletChainError(err, walletChainId)
          : formatApiErrorMessage(err, 'Wallet verification failed'),
      );
    }
  };

  const handleCreateMandate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const walletAddress = connectedWallet?.address ? getAddress(connectedWallet.address) : null;
    const walletChainId = authorityChainId;
    if (!verifiedForAuthorityChain || !connectedWallet || !signableWallet || !walletAddress || !walletChainId) {
      setActionError('Verify the connected wallet on the selected chain before signing a mandate.');
      return;
    }

    const form = new FormData(e.currentTarget);
    const validDays = Math.max(1, Number(form.get('validDays') ?? 30));
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
    const body = {
      agentId: String(form.get('agentId')),
      policyId: String(form.get('policyId') || '') || undefined,
      signerAddress: walletAddress,
      chainId: walletChainId,
      allowedChains: [walletChainId],
      allowedActions: commaList(form.get('allowedActions'), ['transfer']),
      allowedAssets: commaList(form.get('allowedAssets'), ['native']),
      allowedTargets: commaList(form.get('allowedTargets'), ['*']),
      maxPerTransaction: String(form.get('maxPerTransaction') || '') || undefined,
      maxTotal: String(form.get('maxTotal') || '') || undefined,
      approvalThreshold: String(form.get('approvalThreshold') || '') || undefined,
      validUntil,
    };

    setIsSigningMandate(true);
    try {
      await ensureAuthorityChainInWallet();
      const typedData = await typedDataMutation.mutateAsync(body);
      const bodyWithNonce = { ...body, nonce: typedData.nonce };
      const preparedTypedData = prepareMandateTypedDataForSigning(
        typedData.typedData as Parameters<typeof prepareMandateTypedDataForSigning>[0],
      );
      const signature = await requestTypedDataSignature(signableWallet, preparedTypedData);
      await createMandateMutation.mutateAsync({
        ...bodyWithNonce,
        signature,
        typedDataHash: typedData.typedDataHash,
        signedTypedData: typedData.typedData,
      });
      await mandatesQuery.refetch();
      setActionSuccess('Signed mandate stored. Agent authority is now bound to the selected policy and limits.');
    } catch (err) {
      setActionError(
        isWalletChainError(err)
          ? formatWalletChainError(err, walletChainId)
          : formatApiErrorMessage(err, 'Mandate signing failed'),
      );
    } finally {
      setIsSigningMandate(false);
    }
  };

  const handleRevokeMandate = async (mandateId: string) => {
    const reason = window.prompt('Reason for revoking this mandate:');
    if (!reason?.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await revokeMandateMutation.mutateAsync({ mandateId, reason: reason.trim() });
      setActionSuccess('Mandate revoked.');
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Mandate revocation failed'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet & Authority"
        description="Verify owner wallet authority, then review the relayer, treasury, and settlement contract state."
      >
        <select value={chainId} onChange={(e) => setChainId(Number(e.target.value))} className="app-input w-auto">
          <option value={421614}>Arbitrum Sepolia</option>
          <option value={46630}>Robinhood Testnet</option>
        </select>
      </PageHeader>

      {walletNeedsChainSwitch && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Your wallet is on the wrong network</p>
          <p className="mt-2 leading-6">
            {walletChainBannerMessage(effectiveWalletChainId, authorityChainId)}
          </p>
          <button
            type="button"
            className="app-btn app-btn-primary mt-4"
            disabled={!connectedWallet || isSwitchingChain}
            onClick={handleSwitchWalletNetwork}
          >
            {isSwitchingChain ? 'Switching network...' : `Switch wallet to ${chainName(authorityChainId)}`}
          </button>
        </div>
      )}

      {unsupportedConnectedChain && !walletNeedsChainSwitch && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Connected wallet is on {chainName(effectiveWalletChainId)}. VALEN currently supports Arbitrum Sepolia and Robinhood Testnet.
        </div>
      )}

      {(actionError || actionSuccess) && (
        <div className={`rounded-2xl border p-4 text-sm ${actionError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {actionError ?? actionSuccess}
        </div>
      )}

      <section className="app-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f4ff]">
              <ShieldCheck className="h-6 w-6 text-[#007dfc]" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#012b54]">Owner wallet authority</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              Sign a wallet ownership challenge before VALEN treats this wallet as the organization authority source.
              The message signature is a proof only; it does not send an on-chain transaction.
            </p>
            <button
              type="button"
              className="app-btn app-btn-primary mt-5"
              disabled={!connectedWallet || challengeMutation.isPending || verifyMutation.isPending}
              onClick={handleVerifyConnectedWallet}
            >
              <Wallet className="h-4 w-4" />
              {challengeMutation.isPending || verifyMutation.isPending ? 'Verifying...' : 'Verify Connected Wallet'}
            </button>
          </div>

          <div className="space-y-3">
            <div className="wallet-row">
              <span>Connected wallet</span>
              <code>{shortAddress(connectedWallet?.address)}</code>
            </div>
            <div className="wallet-row">
              <span>Wallet network</span>
              <strong>
                {effectiveWalletChainId
                  ? `${chainName(effectiveWalletChainId)} (${effectiveWalletChainId})`
                  : 'Unknown'}
              </strong>
            </div>
            <div className="wallet-row">
              <span>Verification status</span>
              <strong>{verifiedForAuthorityChain ? 'Verified owner' : 'Not verified'}</strong>
            </div>
            <div className="wallet-row">
              <span>Authority chain</span>
              <ChainBadge chainId={authorityChainId} />
            </div>
            <div className="wallet-row">
              <span>Verified wallets</span>
              <strong>{verifiedWallets.filter((wallet) => wallet.status === 'verified').length}</strong>
            </div>
            {verifiedForAuthorityChain && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle className="mr-2 inline h-4 w-4" />
                Verified at {verifiedForAuthorityChain.verifiedAt ? new Date(verifiedForAuthorityChain.verifiedAt).toLocaleString() : 'unknown time'}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="app-card">
        <div className="app-card-header">
          <div>
            <h2 className="app-card-title">Signed Agent Mandates</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Bind a verified owner wallet to an active agent, policy, chains, actions, targets, limits, and expiry.
            </p>
          </div>
          <span className="wallet-status wallet-status-ok">
            {mandates.filter((mandate) => mandate.status === 'active').length} active
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={handleCreateMandate} className="space-y-4 rounded-2xl border border-[#eef0f3] p-4">
            <div className="app-form-group">
              <label htmlFor="agentId">Active Agent</label>
              <select id="agentId" name="agentId" className="app-input" required disabled={!activeAgentOptions.length}>
                <option value="">Select agent</option>
                {activeAgentOptions.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="app-form-group">
              <label htmlFor="policyId">Policy</label>
              <select id="policyId" name="policyId" className="app-input">
                <option value="">Agent default policy</option>
                {policies?.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="app-form-group">
                <label htmlFor="allowedActions">Allowed Actions</label>
                <input id="allowedActions" name="allowedActions" className="app-input" defaultValue="transfer" />
              </div>
              <div className="app-form-group">
                <label htmlFor="allowedAssets">Allowed Assets</label>
                <input id="allowedAssets" name="allowedAssets" className="app-input" defaultValue="native" />
              </div>
            </div>
            <div className="app-form-group">
              <label htmlFor="allowedTargets">Allowed Targets</label>
              <input id="allowedTargets" name="allowedTargets" className="app-input" defaultValue="*" />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="app-form-group">
                <label htmlFor="maxPerTransaction">Max / Tx</label>
                <input id="maxPerTransaction" name="maxPerTransaction" className="app-input" placeholder="0.1 ETH" />
              </div>
              <div className="app-form-group">
                <label htmlFor="maxTotal">Max Total</label>
                <input id="maxTotal" name="maxTotal" className="app-input" placeholder="1 ETH" />
              </div>
              <div className="app-form-group">
                <label htmlFor="validDays">Valid Days</label>
                <input id="validDays" name="validDays" className="app-input" type="number" min={1} defaultValue={30} />
              </div>
            </div>
            <div className="app-form-group">
              <label htmlFor="approvalThreshold">Approval Threshold</label>
              <input id="approvalThreshold" name="approvalThreshold" className="app-input" placeholder="risk > 70 or amount > 0.5 ETH" />
            </div>
            <button
              type="submit"
              className="app-btn app-btn-primary"
              disabled={!verifiedForAuthorityChain || !activeAgentOptions.length || isSigningMandate || typedDataMutation.isPending || createMandateMutation.isPending}
            >
              {isSigningMandate || typedDataMutation.isPending || createMandateMutation.isPending ? 'Signing...' : 'Sign Mandate'}
            </button>
            {!verifiedForAuthorityChain && (
              <p className="text-xs font-medium text-amber-700">Verify the connected wallet on the selected authority chain before signing mandates.</p>
            )}
            {verifiedForAuthorityChain && walletNeedsChainSwitch && (
              <p className="text-xs font-medium text-amber-700">
                Switch your wallet to {chainName(authorityChainId)} before signing. Use the banner above or click Sign Mandate to auto-switch.
              </p>
            )}
          </form>

          <div className="space-y-3">
            {!mandates.length && (
              <div className="rounded-2xl border border-dashed border-[#cbd5e1] p-5 text-sm text-[#64748b]">
                No mandates have been signed yet.
              </div>
            )}
            {mandates.map((mandate) => (
              <div key={mandate.id} className="rounded-2xl border border-[#eef0f3] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-[#64748b]">{mandate.id}</p>
                    <p className="mt-1 text-sm font-semibold text-[#012b54]">
                      {mandate.allowedActions.join(', ') || 'No actions'} on {chainName(mandate.chainId)}
                    </p>
                  </div>
                  <span className={`wallet-status wallet-status-${mandate.status === 'active' ? 'ok' : 'warn'}`}>
                    {mandate.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-[#64748b] md:grid-cols-2">
                  <span>Signer: {shortAddress(mandate.signerAddress)}</span>
                  <span>Expires: {new Date(mandate.validUntil).toLocaleDateString()}</span>
                  <span>Max / Tx: {mandate.maxPerTransaction ?? 'Not set'}</span>
                  <span>Max Total: {mandate.maxTotal ?? 'Not set'}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="app-btn app-btn-outline"
                    onClick={() => navigator.clipboard.writeText(mandate.typedDataHash)}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Hash
                  </button>
                  {mandate.status === 'active' && (
                    <button
                      type="button"
                      className="app-btn app-btn-danger"
                      disabled={revokeMandateMutation.isPending}
                      onClick={() => handleRevokeMandate(mandate.id)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="app-card xl:col-span-2">
          <h3 className="app-card-title mb-3">Live wallet balances</h3>
          <WalletBalancesPanel walletAddress={connectedWallet?.address} />
        </div>

        <WalletCard
          title="Connected Wallet"
          subtitle={ready ? 'Privy wallet connection state' : 'Loading Privy wallet state'}
          address={connectedWallet?.address}
          chainId={effectiveWalletChainId}
          balance={connectedBalanceSummary}
          status={connectedWallet ? 'Connected' : ready ? 'Disconnected' : 'Loading'}
          statusTone={connectedWallet ? (unsupportedConnectedChain ? 'warn' : 'ok') : 'warn'}
          note="ETH on Arbitrum Sepolia and Robinhood Testnet, plus USDC on Arbitrum Sepolia when available. Read from chain RPC — not from Render."
        />

        <WalletCard
          title="Organization Wallet"
          subtitle={organization?.name ?? 'Current organization'}
          address={null}
          chainId={organization?.defaultChainId}
          balance={null}
          status="Not exposed"
          statusTone="warn"
          note="Render currently exposes organization metadata, but not an organization treasury/wallet read endpoint distinct from ValenTreasury."
        />

        <WalletCard
          title="Agent Wallets"
          subtitle={`${activeAgents} active agent(s) in this organization`}
          address={null}
          chainId={organization?.defaultChainId}
          balance={null}
          status="Link-only"
          statusTone="warn"
          note="Agent detail pages can link wallets through Render. A list/balance read endpoint is not currently exposed, so this page does not invent agent wallet data."
        />

        <WalletCard
          title="Settlement Wallet"
          subtitle="ValenSettlement contract for selected chain"
          address={SETTLEMENT_ADDRESSES[chainId]}
          chainId={chainId}
          balance={null}
          status={SETTLEMENT_ADDRESSES[chainId] ? 'Configured' : 'Missing env'}
          statusTone={SETTLEMENT_ADDRESSES[chainId] ? 'ok' : 'error'}
          note="This is the live deployed settlement contract address from frontend env, not a generated wallet."
        />

        <WalletCard
          title="Treasury Wallet"
          subtitle="Live ValenTreasury read via Render operator API"
          address={treasuryQuery.data?.treasuryAddress}
          chainId={chainId}
          balance={treasuryQuery.data ? `${treasuryQuery.data.nativeBalanceEth ?? '0'} ETH` : null}
          status={treasuryQuery.isError ? 'Error' : treasuryQuery.isLoading ? 'Loading' : 'Live'}
          statusTone={treasuryQuery.isError ? 'error' : 'ok'}
          note={
            treasuryQuery.isError
              ? 'Render treasury read failed. Check OPERATOR_DASHBOARD_SECRET and Render API health.'
              : `Accrued fees: ${treasuryQuery.data?.accruedFeesWei ?? 'unavailable'} wei · Collected fees: ${treasuryQuery.data?.collectedFeesWei ?? 'unavailable'} wei`
          }
        />
      </div>
    </div>
  );
}
