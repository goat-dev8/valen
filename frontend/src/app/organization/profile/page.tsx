'use client';

import Link from 'next/link';
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
import { useConnectedWalletAddress } from '@/hooks/use-connected-wallet-address';
import { shortAddress } from '@/lib/authority-wallet-signing';
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
  const { address: connectedWallet, isPrivyConnected, walletsReady } = useConnectedWalletAddress();
  const displayName = me?.user.displayName ?? me?.user.email ?? 'User';
  const { data: summary } = useDashboardSummary();
  const { data: agents } = useAgents({ limit: 100 });
  const { data: policies } = usePolicies();
  const { data: mandates } = useMandates();
  const { data: verifications } = useWalletVerifications();
  const { data: executions } = useExecutions({ limit: 8 });

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

  const orgInitials = organization?.name?.slice(0, 2).toUpperCase() ?? 'OR';
  const userInitials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const kpis = [
    { label: 'Total Assets', value: String(PORTFOLIO_SYMBOLS.length), icon: TrendingUp },
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
        <div className="org-profile-hero-premium__banner">
          <div className="org-profile-hero-premium__avatar org-profile-hero-premium__avatar--wallet">
            {connectedWallet ? shortAddress(connectedWallet).slice(0, 2).toUpperCase() : orgInitials}
          </div>
          <div className="org-profile-hero-premium__identity">
            <p className="org-profile-hero__eyebrow">Organization Overview</p>
            <h1 className="org-profile-hero__title">
              {connectedWallet ? (
                <span className="org-profile-hero__wallet">{shortAddress(connectedWallet)}</span>
              ) : walletsReady ? (
                'Connect your wallet'
              ) : (
                'Loading wallet…'
              )}
            </h1>
            <p className="org-profile-hero__org-name">{organization?.name ?? 'Organization'}</p>
            <div className="org-dual-network org-dual-network--center">
              {SUPPORTED_CHAIN_IDS.map((chainId) => (
                <ChainBadge key={chainId} chainId={chainId} />
              ))}
            </div>
          </div>
          <div className="org-profile-hero-premium__user">
            <div className="org-profile-hero-premium__user-avatar">{userInitials}</div>
            <div>
              <p className="org-profile-hero-premium__user-name">{displayName}</p>
              <p className="org-profile-hero-premium__user-role">{roleLabel}</p>
            </div>
          </div>
        </div>
        <div className="org-profile-hero-premium__footer">
          <div className="org-profile-hero-premium__meta">
            <span>{organization?.plan ?? 'Development'}</span>
            {connectedWallet && (
              <span className="org-profile-hero__connection">
                {isPrivyConnected ? 'Privy connected' : 'Verified authority wallet'}
              </span>
            )}
            {organization?.createdAt && <span>Created {new Date(organization.createdAt).toLocaleDateString()}</span>}
          </div>
          {connectedWallet && (
            <button type="button" className="org-profile-id" onClick={() => void copyToClipboard(connectedWallet)}>
              <code>{connectedWallet}</code>
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

      <div className="org-profile-layout">
        <section className="app-panel-floating org-profile-panel org-profile-panel--wide">
          <header className="org-profile-panel__header">
            <div className="org-profile-panel__icon">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="org-profile-panel__title">Portfolio</h2>
              <p className="org-profile-panel__desc">Live token balances across Arbitrum Sepolia and Robinhood Testnet.</p>
            </div>
          </header>
          <WalletBalancesPanel walletAddress={connectedWallet} layout="grid" compact />
        </section>

        <section className="app-panel-floating org-profile-panel">
          <header className="org-profile-panel__header">
            <div className="org-profile-panel__icon">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="org-profile-panel__title">Wallets</h2>
              <p className="org-profile-panel__desc">Connected and verified authority wallets per chain.</p>
            </div>
          </header>
          <div className="org-dual-network">
            {SUPPORTED_CHAIN_IDS.map((chainId) => (
              <ChainBadge key={chainId} chainId={chainId} />
            ))}
          </div>
          <dl className="org-fact-list">
            <div>
              <dt>Connected wallet</dt>
              <dd className="org-fact-list__mono">
                {connectedWallet ?? (walletsReady ? 'Not connected' : 'Loading…')}
              </dd>
            </div>
            <div>
              <dt>Arbitrum Sepolia authority</dt>
              <dd className="org-fact-list__mono">
                {verifications?.find((v) => v.chainId === 421614 && v.status === 'verified')?.walletAddress ?? 'Not verified'}
              </dd>
            </div>
            <div>
              <dt>Robinhood Testnet authority</dt>
              <dd className="org-fact-list__mono">
                {verifications?.find((v) => v.chainId === 46630 && v.status === 'verified')?.walletAddress ?? 'Not verified'}
              </dd>
            </div>
          </dl>
          <Link href="/dashboard/authority" className="app-link org-profile-panel__action">
            Manage authority wallets
          </Link>
        </section>

        <section className="app-panel-floating org-profile-panel">
          <header className="org-profile-panel__header">
            <div className="org-profile-panel__icon">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="org-profile-panel__title">Governance</h2>
              <p className="org-profile-panel__desc">Agents, policies, mandates, and budget health.</p>
            </div>
          </header>
          <dl className="org-governance-kpis">
            <div>
              <dt>Active agents</dt>
              <dd>{stats?.activeAgents ?? activeAgents.length}</dd>
            </div>
            <div>
              <dt>Active policies</dt>
              <dd>{activePolicies.length}</dd>
            </div>
            <div>
              <dt>Active mandates</dt>
              <dd>{activeMandates.length}</dd>
            </div>
            <div>
              <dt>USDC budget remaining</dt>
              <dd>{formatBudgetRemaining(summary?.budget.remaining ?? stats?.budgetTotals.remaining)}</dd>
            </div>
          </dl>
          <div className="org-profile-panel__actions">
            <Link href="/dashboard/agents" className="app-btn app-btn-outline">Agents</Link>
            <Link href="/dashboard/policies" className="app-btn app-btn-outline">Policies</Link>
            <Link href="/dashboard/budgets" className="app-btn app-btn-outline">Budgets</Link>
          </div>
        </section>

        <section id="identity" className="app-panel-floating org-profile-panel org-profile-panel--wide">
          <header className="org-profile-panel__header">
            <div className="org-profile-panel__icon">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="org-profile-panel__title">Identity</h2>
              <p className="org-profile-panel__desc">
                {primaryAgent
                  ? `Primary agent ERC-8004 identity — ${primaryAgent.name}`
                  : 'Register an agent to bind ERC-8004 identity on-chain.'}
              </p>
            </div>
          </header>
          {primaryAgent ? (
            <div className="org-profile-identity">
              <Erc8004Badge identity={agentIdentity?.erc8004} agentId={primaryAgent.id} publicSlug={primaryAgent.publicSlug} />
            </div>
          ) : (
            <div className="org-profile-empty">
              <p>No active agents yet. Create an agent in Agent Studio to register on-chain identity.</p>
              <Link href="/dashboard/agents/studio" className="app-btn app-btn-primary">Create agent</Link>
            </div>
          )}
        </section>

        <section className="app-panel-floating org-profile-panel org-profile-panel--wide">
          <header className="org-profile-panel__header">
            <div className="org-profile-panel__icon">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="org-profile-panel__title">Activity</h2>
              <p className="org-profile-panel__desc">Recent governed executions across your organization.</p>
            </div>
          </header>
          <div className="org-activity-timeline">
            {(executions?.items ?? []).slice(0, 6).map((execution) => (
              <Link key={execution.id} href={`/dashboard/executions/${execution.id}`} className="org-activity-card">
                <div className="org-activity-card__icon">
                  <AssetIcon symbol={execution.actionType?.includes('transfer') ? 'USDC' : 'ETH'} size={20} />
                </div>
                <div className="org-activity-card__body">
                  <p className="org-activity-card__title">{execution.actionType ?? 'Governed action'}</p>
                  <p className="org-activity-card__meta">
                    {formatExecutionAmount(execution)} · {new Date(execution.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={statusTone(execution.status)}>{execution.status.replace(/_/g, ' ')}</span>
              </Link>
            ))}
            {!executions?.items.length && <p className="org-profile-empty__text">No recent executions yet.</p>}
          </div>
        </section>

        <section className="app-panel-floating org-profile-panel org-profile-panel--wide">
          <header className="org-profile-panel__header">
            <div className="org-profile-panel__icon">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="org-profile-panel__title">Statistics</h2>
              <p className="org-profile-panel__desc">Governance performance and settlement metrics.</p>
            </div>
          </header>
          <div className="org-stats-grid">
            {statBars.map((bar) => (
              <article key={bar.label} className="org-stats-card">
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
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
