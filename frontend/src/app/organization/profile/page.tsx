'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useWallets } from '@privy-io/react-auth';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bot,
  Copy,
  FileCheck,
  Shield,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
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
import { copyToClipboard, formatExecutionAmount } from '@/lib/execution-display';

const SUPPORTED_CHAIN_IDS = [421614, 46630] as const;

const PORTFOLIO_SYMBOLS = ['USDC', 'USDG', 'TSLA', 'AMZN', 'NFLX', 'PLTR', 'AMD', 'ETH'] as const;

function formatBudgetRemaining(value: string | null | undefined): string {
  if (!value) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC`;
  return `${num.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC`;
}

function statusTone(status: string): string {
  if (status.includes('executed') || status.includes('settled') || status.includes('success')) {
    return 'org-status-pill org-status-pill--ok';
  }
  if (status.includes('fail') || status.includes('refus') || status.includes('reject')) {
    return 'org-status-pill org-status-pill--bad';
  }
  return 'org-status-pill org-status-pill--pending';
}

export default function OrganizationProfilePage() {
  const { organization } = useOrganization();
  const { me } = useAuth();
  const { wallets } = useWallets();
  const connectedWallet = wallets[0]?.address;
  const displayName = me?.user.displayName ?? me?.user.email ?? 'User';
  const { data: summary } = useDashboardSummary();
  const { data: agents } = useAgents({ limit: 100 });
  const { data: policies } = usePolicies();
  const { data: mandates } = useMandates();
  const { data: verifications } = useWalletVerifications();
  const { data: executions } = useExecutions({ limit: 8 });
  const { data: balances } = useWalletBalances(connectedWallet);

  const membership = me?.organizations.find((o) => o.id === organization?.id);
  const roleLabel =
    membership?.role === 'organization_owner'
      ? 'Organization Owner'
      : (membership?.role ?? 'member').replace(/_/g, ' ');
  const activeAgents = agents?.items.filter((a) => a.status === 'active') ?? [];
  const activePolicies = policies?.filter((p) => p.status === 'active') ?? [];
  const activeMandates = mandates?.filter((m) => m.status === 'active') ?? [];
  const primaryAgent = activeAgents[0];
  const { data: agentIdentity } = useAgentIdentity(primaryAgent?.id ?? '');
  const stats = summary?.organizationStats;

  const portfolioCards = useMemo(() => {
    const balanceMap = new Map<string, { balance: string; chainId: number }>();
    for (const row of balances ?? []) {
      balanceMap.set(`${row.nativeSymbol}-${row.chainId}`, {
        balance: row.nativeFormatted,
        chainId: row.chainId,
      });
      for (const token of row.tokens) {
        balanceMap.set(`${token.symbol}-${row.chainId}`, {
          balance: token.formatted,
          chainId: row.chainId,
        });
      }
    }

    return PORTFOLIO_SYMBOLS.map((symbol) => {
      const asset = governedHomeAssets().find((item) => item.symbol === symbol);
      const chainId = symbol === 'USDC' || symbol === 'ETH' ? 421614 : 46630;
      const hit = balanceMap.get(`${symbol}-${chainId}`);
      return {
        symbol,
        chainId,
        balance: hit?.balance ?? '0',
        network: chainName(chainId),
        status: connectedWallet ? (Number(hit?.balance ?? 0) > 0 ? 'Funded' : 'Ready') : 'Connect wallet',
      };
    });
  }, [balances, connectedWallet]);

  const orgInitials = organization?.name?.slice(0, 2).toUpperCase() ?? 'OR';
  const userInitials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const kpis = [
    { label: 'Total Assets', value: String(portfolioCards.length), icon: TrendingUp },
    { label: 'Total Agents', value: String(stats?.activeAgents ?? activeAgents.length), icon: Bot },
    { label: 'Total Policies', value: String(activePolicies.length), icon: Shield },
    { label: 'Total Executions', value: String(stats?.governance.totalExecutions ?? summary?.counts.totalExecutions ?? 0), icon: Zap },
    { label: 'Total Proofs', value: String(stats?.governance.totalProofs ?? 0), icon: FileCheck },
  ];

  const statBars = [
    { label: 'Success rate', value: stats?.governance.successRatePercent ?? 0, max: 100, suffix: '%' },
    { label: 'x402 settlements', value: stats?.governance.x402Settlements ?? 0, max: Math.max(stats?.governance.x402Settlements ?? 1, 10), suffix: '' },
    { label: 'Active mandates', value: activeMandates.length, max: Math.max(activeMandates.length, 10), suffix: '' },
  ];

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

      <section className="org-profile-hero-premium app-panel-floating">
        <div className="org-profile-hero-premium__left">
          <div className="org-profile-hero-premium__avatar">{orgInitials}</div>
          <div className="org-profile-hero-premium__user">
            <div className="org-profile-hero-premium__user-avatar">{userInitials}</div>
            <div>
              <p className="org-profile-hero-premium__user-name">{displayName}</p>
              <p className="org-profile-hero-premium__user-role">{roleLabel}</p>
            </div>
          </div>
        </div>
        <div className="org-profile-hero-premium__copy">
          <p className="org-profile-hero__eyebrow">Organization Overview</p>
          <h1 className="org-profile-hero__title">{organization?.name ?? 'Organization'}</h1>
          <div className="org-dual-network">
            {SUPPORTED_CHAIN_IDS.map((chainId) => (
              <ChainBadge key={chainId} chainId={chainId} />
            ))}
          </div>
          <div className="org-profile-hero-premium__meta">
            <span>{organization?.plan ?? 'Development'}</span>
            {organization?.createdAt && <span>Created {new Date(organization.createdAt).toLocaleDateString()}</span>}
          </div>
          {organization?.id && (
            <button type="button" className="org-profile-id" onClick={() => void copyToClipboard(organization.id)}>
              <code>{organization.id}</code>
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>

      <section className="org-kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="org-kpi-card">
            <kpi.icon className="h-5 w-5 text-[#0066FF]" />
            <p className="org-kpi-card__value">{kpi.value}</p>
            <p className="org-kpi-card__label">{kpi.label}</p>
          </article>
        ))}
      </section>

      <div className="org-profile-grid">
        <section className="app-panel-floating org-profile-section org-profile-section--wide">
          <div className="org-profile-section__head">
            <TrendingUp className="h-5 w-5 text-[#0066FF]" />
            <h2>Portfolio</h2>
          </div>
          <div className="org-portfolio-card-grid mt-4">
            {portfolioCards.map((row) => (
              <article key={`${row.symbol}-${row.chainId}`} className="org-portfolio-card">
                <AssetOptionRow symbol={row.symbol} chainId={row.chainId} />
                <div className="org-portfolio-card__footer">
                  <strong>{row.balance}</strong>
                  <span className={statusTone(row.status.toLowerCase())}>{row.status}</span>
                </div>
                <ChainBadge chainId={row.chainId} compact />
              </article>
            ))}
          </div>
          <div className="mt-4">
            <WalletBalancesPanel walletAddress={connectedWallet} compact />
          </div>
        </section>

        <section className="app-panel-floating org-profile-section">
          <div className="org-profile-section__head">
            <Wallet className="h-5 w-5 text-[#0066FF]" />
            <h2>Wallets</h2>
          </div>
          <div className="org-dual-network mt-4">
            {SUPPORTED_CHAIN_IDS.map((chainId) => (
              <ChainBadge key={chainId} chainId={chainId} />
            ))}
          </div>
          <dl className="app-detail-list mt-4">
            <div>
              <dt>Connected wallet</dt>
              <dd className="font-mono text-xs break-all">{connectedWallet ?? 'Not connected'}</dd>
            </div>
            <div>
              <dt>Arbitrum Sepolia authority</dt>
              <dd className="font-mono text-xs break-all">
                {verifications?.find((v) => v.chainId === 421614 && v.status === 'verified')?.walletAddress ?? 'Not verified'}
              </dd>
            </div>
            <div>
              <dt>Robinhood Testnet authority</dt>
              <dd className="font-mono text-xs break-all">
                {verifications?.find((v) => v.chainId === 46630 && v.status === 'verified')?.walletAddress ?? 'Not verified'}
              </dd>
            </div>
          </dl>
          <Link href="/dashboard/authority" className="app-link mt-4 inline-block text-sm">
            Manage authority wallets
          </Link>
        </section>

        <section className="app-panel-floating org-profile-section">
          <div className="org-profile-section__head">
            <Shield className="h-5 w-5 text-[#0066FF]" />
            <h2>Governance</h2>
          </div>
          <div className="org-governance-stats mt-4">
            <div><span>Active agents</span><strong>{stats?.activeAgents ?? activeAgents.length}</strong></div>
            <div><span>Active policies</span><strong>{activePolicies.length}</strong></div>
            <div><span>Active mandates</span><strong>{activeMandates.length}</strong></div>
            <div><span>USDC budget remaining</span><strong>{formatBudgetRemaining(summary?.budget.remaining ?? stats?.budgetTotals.remaining)}</strong></div>
          </div>
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
          <div className="org-activity-timeline mt-4">
            {(executions?.items ?? []).slice(0, 6).map((execution) => (
              <Link key={execution.id} href={`/dashboard/executions/${execution.id}`} className="org-activity-card">
                <div className="org-activity-card__icon">
                  <AssetIcon symbol={execution.actionType?.includes('transfer') ? 'USDC' : 'ETH'} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="org-activity-card__title">{execution.actionType ?? 'Governed action'}</p>
                  <p className="org-activity-card__meta">
                    {formatExecutionAmount(execution)} · {new Date(execution.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={statusTone(execution.status)}>{execution.status.replace(/_/g, ' ')}</span>
              </Link>
            ))}
            {!executions?.items.length && <p className="text-sm text-[#64748b]">No recent executions yet.</p>}
          </div>
        </section>

        <section className="app-panel-floating org-profile-section org-profile-section--wide">
          <div className="org-profile-section__head">
            <BarChart3 className="h-5 w-5 text-[#0066FF]" />
            <h2>Statistics</h2>
          </div>
          <div className="org-stats-bars mt-4">
            {statBars.map((bar) => (
              <div key={bar.label} className="org-stats-bar">
                <div className="org-stats-bar__head">
                  <span>{bar.label}</span>
                  <strong>
                    {bar.value}
                    {bar.suffix}
                  </strong>
                </div>
                <div className="org-stats-bar__track">
                  <div
                    className="org-stats-bar__fill"
                    style={{ width: `${Math.min(100, (bar.value / bar.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
