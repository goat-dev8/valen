'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useWallets } from '@privy-io/react-auth';
import {
  Activity,
  ArrowLeft,
  Building2,
  Copy,
  Shield,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { AssetOptionRow } from '@/components/app/asset-option-row';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { WalletBalancesPanel } from '@/components/app/wallet-balances-panel';
import { Erc8004Badge } from '@/components/app/erc8004-badge';
import { useOrganization } from '@/contexts/org-context';
import { useAuth } from '@/contexts/auth-context';
import {
  useAgents,
  useAgentIdentity,
  useDashboardSummary,
  useExecutions,
  useMandates,
  usePolicies,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { chainName } from '@/lib/constants';
import { governedHomeAssets } from '@/lib/known-assets';
import { copyToClipboard } from '@/lib/execution-display';

export default function OrganizationProfilePage() {
  const { organization } = useOrganization();
  const { me } = useAuth();
  const { wallets } = useWallets();
  const connectedWallet = wallets[0]?.address;
  const { data: summary } = useDashboardSummary();
  const { data: agents } = useAgents({ limit: 100 });
  const { data: policies } = usePolicies();
  const { data: mandates } = useMandates();
  const { data: verifications } = useWalletVerifications();
  const { data: executions } = useExecutions({ limit: 5 });
  const { data: balances } = useWalletBalances(connectedWallet);

  const membership = me?.organizations.find((o) => o.id === organization?.id);
  const roleLabel = (membership?.role ?? 'member').replace(/_/g, ' ');
  const activeAgents = agents?.items.filter((a) => a.status === 'active') ?? [];
  const activePolicies = policies?.filter((p) => p.status === 'active') ?? [];
  const activeMandates = mandates?.filter((m) => m.status === 'active') ?? [];
  const primaryAgent = activeAgents[0];
  const { data: agentIdentity } = useAgentIdentity(primaryAgent?.id ?? '');

  const portfolioRows = useMemo(() => {
    const rows: Array<{ symbol: string; balance: string; chainId: number; network: string }> = [];
    for (const row of balances ?? []) {
      rows.push({
        symbol: row.nativeSymbol,
        balance: row.nativeFormatted,
        chainId: row.chainId,
        network: chainName(row.chainId),
      });
      for (const token of row.tokens) {
        rows.push({
          symbol: token.symbol,
          balance: token.formatted,
          chainId: row.chainId,
          network: chainName(row.chainId),
        });
      }
    }
    for (const asset of governedHomeAssets()) {
      if (!rows.some((row) => row.symbol === asset.symbol && row.chainId === (asset.address === 'native' ? 421614 : asset.symbol === 'USDC' ? 421614 : 46630))) {
        const chainId = asset.symbol === 'USDC' ? 421614 : 46630;
        rows.push({ symbol: asset.symbol, balance: '—', chainId, network: chainName(chainId) });
      }
    }
    return rows;
  }, [balances]);

  const orgInitials = organization?.name?.slice(0, 2).toUpperCase() ?? 'OR';
  const stats = summary?.organizationStats;

  return (
    <div className="org-profile-page space-y-6">
      <Link href="/dashboard" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Command Center
      </Link>

      <PageHeader
        title="Organization Profile"
        description="Portfolio, governance, identity, and activity for your governed agent operating system."
      />

      <section className="org-profile-hero app-panel-floating">
        <div className="org-profile-hero__avatar">{orgInitials}</div>
        <div className="org-profile-hero__copy">
          <p className="org-profile-hero__eyebrow">Organization Overview</p>
          <h1 className="org-profile-hero__title">{organization?.name ?? 'Organization'}</h1>
          <p className="org-profile-hero__role capitalize">{roleLabel}</p>
          <div className="org-profile-hero__meta">
            <ChainBadge chainId={organization?.defaultChainId ?? 421614} />
            <span>{organization?.plan ?? 'Development'}</span>
            {organization?.createdAt && (
              <span>Created {new Date(organization.createdAt).toLocaleDateString()}</span>
            )}
          </div>
          {organization?.id && (
            <button
              type="button"
              className="org-profile-id"
              onClick={() => void copyToClipboard(organization.id)}
            >
              <code>{organization.id}</code>
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>

      <div className="org-profile-grid">
        <section className="app-panel-floating org-profile-section">
          <div className="org-profile-section__head">
            <Wallet className="h-5 w-5 text-[#0066FF]" />
            <h2>Wallets</h2>
          </div>
          <dl className="app-detail-list mt-4">
            <div>
              <dt>Connected wallet</dt>
              <dd className="font-mono text-xs">{connectedWallet ?? 'Not connected'}</dd>
            </div>
            <div>
              <dt>Arbitrum Sepolia</dt>
              <dd>{verifications?.find((v) => v.chainId === 421614 && v.status === 'verified')?.walletAddress ?? '—'}</dd>
            </div>
            <div>
              <dt>Robinhood Testnet</dt>
              <dd>{verifications?.find((v) => v.chainId === 46630 && v.status === 'verified')?.walletAddress ?? '—'}</dd>
            </div>
          </dl>
          <Link href="/dashboard/authority" className="app-link mt-4 inline-block text-sm">
            Manage authority wallets
          </Link>
        </section>

        <section className="app-panel-floating org-profile-section">
          <div className="org-profile-section__head">
            <TrendingUp className="h-5 w-5 text-[#0066FF]" />
            <h2>Portfolio</h2>
          </div>
          <div className="org-portfolio-table mt-4">
            <div className="org-portfolio-table__head">
              <span>Asset</span>
              <span>Balance</span>
              <span>Network</span>
            </div>
            {portfolioRows.map((row) => (
              <div key={`${row.symbol}-${row.chainId}`} className="org-portfolio-table__row">
                <AssetOptionRow symbol={row.symbol} chainId={row.chainId} compact />
                <strong>{row.balance}</strong>
                <ChainBadge chainId={row.chainId} compact />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <WalletBalancesPanel walletAddress={connectedWallet} compact />
          </div>
        </section>

        <section className="app-panel-floating org-profile-section">
          <div className="org-profile-section__head">
            <Building2 className="h-5 w-5 text-[#0066FF]" />
            <h2>Governance</h2>
          </div>
          <dl className="app-detail-list mt-4">
            <div><dt>Active agents</dt><dd>{stats?.activeAgents ?? activeAgents.length}</dd></div>
            <div><dt>Active policies</dt><dd>{activePolicies.length}</dd></div>
            <div><dt>Active mandates</dt><dd>{activeMandates.length}</dd></div>
            <div><dt>USDC budget remaining</dt><dd>{summary?.budget.remaining ?? stats?.budgetTotals.remaining ?? '—'}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/agents" className="app-btn app-btn-outline">Agents</Link>
            <Link href="/dashboard/policies" className="app-btn app-btn-outline">Policies</Link>
            <Link href="/dashboard/budgets" className="app-btn app-btn-outline">Budgets</Link>
          </div>
        </section>

        <section id="identity" className="app-panel-floating org-profile-section org-profile-section--wide">
          <div className="org-profile-section__head">
            <Shield className="h-5 w-5 text-[#0066FF]" />
            <h2>Identity</h2>
          </div>
          {primaryAgent ? (
            <div className="mt-4">
              <p className="mb-3 text-sm text-[#64748b]">Primary agent ERC-8004 identity — {primaryAgent.name}</p>
              <Erc8004Badge identity={agentIdentity?.erc8004} agentId={primaryAgent.id} publicSlug={primaryAgent.publicSlug} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#64748b]">Register an agent to bind ERC-8004 identity on-chain.</p>
          )}
        </section>

        <section className="app-panel-floating org-profile-section org-profile-section--wide">
          <div className="org-profile-section__head">
            <Activity className="h-5 w-5 text-[#0066FF]" />
            <h2>Activity</h2>
          </div>
          <div className="org-activity-list mt-4">
            {(executions?.items ?? []).slice(0, 5).map((execution) => (
              <Link key={execution.id} href={`/dashboard/executions/${execution.id}`} className="org-activity-row">
                <span>{execution.actionType ?? 'Execution'}</span>
                <span className="capitalize">{execution.status.replace(/_/g, ' ')}</span>
                <span>{new Date(execution.createdAt).toLocaleString()}</span>
              </Link>
            ))}
            {!executions?.items.length && <p className="text-sm text-[#64748b]">No recent executions yet.</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {summary?.latest.proof?.href && (
              <Link href={summary.latest.proof.href} className="app-btn app-btn-outline">Latest proof</Link>
            )}
            <Link href="/dashboard/proofs" className="app-btn app-btn-outline">Outcome ledger</Link>
          </div>
        </section>

        <section className="app-panel-floating org-profile-section">
          <div className="org-profile-section__head">
            <TrendingUp className="h-5 w-5 text-[#0066FF]" />
            <h2>Statistics</h2>
          </div>
          <dl className="app-detail-list mt-4">
            <div><dt>Total payments</dt><dd>{stats?.governance.x402Settlements ?? 0}</dd></div>
            <div><dt>Total proofs</dt><dd>{stats?.governance.totalProofs ?? 0}</dd></div>
            <div><dt>Governed actions</dt><dd>{stats?.governance.totalExecutions ?? summary?.counts.totalExecutions ?? 0}</dd></div>
            <div><dt>Success rate</dt><dd>{stats?.governance.successRatePercent ?? 0}%</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
