'use client';

import { useMemo, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, Wallet } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { useOrganization } from '@/contexts/org-context';
import { useAgents } from '@/hooks/use-valen-api';
import { operatorFetch } from '@/lib/api';
import { chainName } from '@/lib/constants';
import { explorerAddressUrl } from '@/lib/explorer';

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
  const [chainId, setChainId] = useState<number>(organization?.defaultChainId ?? 421614);

  const treasuryQuery = useQuery({
    queryKey: ['operator-treasury', chainId],
    queryFn: () => operatorFetch<TreasuryData>(`treasury?chainId=${chainId}`),
  });

  const connectedWallet = wallets[0];
  const connectedChainId = normalizeChainId(connectedWallet?.chainId);
  const unsupportedConnectedChain = Boolean(
    connectedChainId && !SUPPORTED_CHAIN_IDS.includes(connectedChainId as (typeof SUPPORTED_CHAIN_IDS)[number]),
  );

  const activeAgents = useMemo(
    () => agents?.items.filter((agent) => agent.status === 'active').length ?? 0,
    [agents],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet Center"
        description="Live wallet, treasury, and settlement address state. Missing backend wallet reads fail visibly."
      >
        <select value={chainId} onChange={(e) => setChainId(Number(e.target.value))} className="app-input w-auto">
          <option value={421614}>Arbitrum Sepolia</option>
          <option value={46630}>Robinhood Testnet</option>
        </select>
      </PageHeader>

      {unsupportedConnectedChain && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Connected wallet is on {chainName(connectedChainId)}. VALEN currently supports Arbitrum Sepolia and Robinhood Testnet.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <WalletCard
          title="Connected Wallet"
          subtitle={ready ? 'Privy wallet connection state' : 'Loading Privy wallet state'}
          address={connectedWallet?.address}
          chainId={connectedChainId}
          balance={null}
          status={connectedWallet ? 'Connected' : ready ? 'Disconnected' : 'Loading'}
          statusTone={connectedWallet ? (unsupportedConnectedChain ? 'warn' : 'ok') : 'warn'}
          note="Address and chain come from Privy. Balance is not displayed until Render exposes a wallet balance endpoint or approved wallet-provider balance flow."
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
