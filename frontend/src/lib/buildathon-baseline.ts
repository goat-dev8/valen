/**
 * Frozen buildathon proof baseline — judge-readable evidence from production E2E.
 * Source: docs/summary.md production verification (2026-06-13).
 */

export type BaselineExecution = {
  id: string;
  chainId: number;
  chainLabel: string;
  assetNarrative: string;
  status: 'executed';
  proofHref: string;
  detailHref: string;
  verifiedAt: string;
  note: string;
};

export type RouteCategory = 'primary_flow' | 'supporting_evidence' | 'admin';

export type CategorizedRoute = {
  path: string;
  label: string;
  category: RouteCategory;
};

export const BUILDATHON_BASELINE_EXECUTIONS: BaselineExecution[] = [
  {
    id: 'd872b0a7-e7de-4a86-887b-b6ac682c7173',
    chainId: 421614,
    chainLabel: 'Arbitrum Sepolia',
    assetNarrative: 'USDC policy scope (native ETH settlement)',
    status: 'executed',
    proofHref: '/dashboard/executions/d872b0a7-e7de-4a86-887b-b6ac682c7173/proof',
    detailHref: '/dashboard/executions/d872b0a7-e7de-4a86-887b-b6ac682c7173',
    verifiedAt: '2026-06-13',
    note: 'Full pipeline: compliance → risk → policy → settlement → proof on Render.',
  },
  {
    id: '7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c',
    chainId: 46630,
    chainLabel: 'Robinhood Testnet',
    assetNarrative: 'TSLA tokenized-asset demo (native ETH settlement)',
    status: 'executed',
    proofHref: '/dashboard/executions/7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c/proof',
    detailHref: '/dashboard/executions/7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c',
    verifiedAt: '2026-06-13',
    note: 'Robinhood headline demo: mandate match, Stylus attestation, confirmed settlement.',
  },
];

export const DASHBOARD_ROUTE_MATRIX: CategorizedRoute[] = [
  { path: '/dashboard', label: 'Mission Control', category: 'primary_flow' },
  { path: '/onboarding', label: 'Guided Setup', category: 'primary_flow' },
  { path: '/dashboard/wallets', label: 'Fund & Authority', category: 'primary_flow' },
  { path: '/dashboard/agents', label: 'Agents', category: 'primary_flow' },
  { path: '/dashboard/register-agent', label: 'Register Agent', category: 'primary_flow' },
  { path: '/dashboard/policies', label: 'Rules', category: 'primary_flow' },
  { path: '/dashboard/policies/new', label: 'Create Rule', category: 'primary_flow' },
  { path: '/dashboard/executions', label: 'Activity', category: 'primary_flow' },
  { path: '/dashboard/executions/new', label: 'Intent Builder', category: 'primary_flow' },
  { path: '/dashboard/executions/[executionId]/proof', label: 'Proof', category: 'primary_flow' },
  { path: '/dashboard/demo/robinhood-tsla', label: 'Robinhood Assets', category: 'primary_flow' },
  { path: '/dashboard/approvals', label: 'Approvals', category: 'supporting_evidence' },
  { path: '/dashboard/settlements', label: 'Settlements', category: 'supporting_evidence' },
  { path: '/dashboard/compliance', label: 'Compliance', category: 'supporting_evidence' },
  { path: '/dashboard/audit', label: 'Audit Logs', category: 'admin' },
  { path: '/dashboard/governance', label: 'Governance', category: 'admin' },
  { path: '/dashboard/treasury', label: 'Treasury', category: 'admin' },
  { path: '/dashboard/contracts', label: 'Contracts', category: 'admin' },
  { path: '/dashboard/webhooks', label: 'Webhooks', category: 'admin' },
  { path: '/dashboard/team', label: 'Team', category: 'admin' },
  { path: '/dashboard/settings', label: 'Settings', category: 'admin' },
];

export function baselineExecutionForChain(chainId: number): BaselineExecution | undefined {
  return BUILDATHON_BASELINE_EXECUTIONS.find((row) => row.chainId === chainId);
}
