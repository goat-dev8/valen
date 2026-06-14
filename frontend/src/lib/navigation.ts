import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Bot,
  FileCheck,
  FileText,
  Shield,
  PieChart,
  TrendingUp,
  CheckCircle,
  ArrowLeftRight,
  Scale,
  ScrollText,
  Webhook,
  Users,
  Settings,
  BookOpen,
  Blocks,
  Landmark,
  List,
  Zap,
  CreditCard,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'approvals';
  description?: string;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  judgeModeHidden?: boolean;
};

/** Page title — can differ from the short sidebar label */
export const GOVERNED_INTENT_LABEL = 'Governed Intent';
export const GOVERNED_INTENT_PATH = '/dashboard/executions/new';

export const OUTCOME_LEDGER_NAV_LABEL = 'Proofs';

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Home',
        icon: LayoutDashboard,
        description: 'Agent status, governance, and proofs',
      },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    items: [{ href: '/dashboard/agents', label: 'Agents', icon: Bot }],
  },
  {
    id: 'actions',
    label: 'Actions',
    items: [
      {
        href: GOVERNED_INTENT_PATH,
        label: 'Intent',
        icon: Zap,
        description: 'Submit a policy-checked intent for settlement',
      },
      {
        href: '/dashboard/payments',
        label: 'Payments',
        icon: CreditCard,
        description: 'HTTP 402 micropayments with proof',
      },
    ],
  },
  {
    id: 'proofs',
    label: 'Proofs',
    items: [
      {
        href: '/dashboard/proofs',
        label: OUTCOME_LEDGER_NAV_LABEL,
        icon: FileCheck,
        description: 'Auditable settled and refused outcomes',
      },
    ],
  },
  {
    id: 'control',
    label: 'Control',
    items: [
      { href: '/dashboard/policies', label: 'Policies', icon: FileText },
      { href: '/dashboard/authority', label: 'Authority', icon: Shield },
      { href: '/dashboard/budgets', label: 'Budgets', icon: PieChart },
      { href: '/dashboard/assets', label: 'Assets', icon: TrendingUp },
    ],
  },
  {
    id: 'advanced',
    label: 'More',
    collapsible: true,
    judgeModeHidden: true,
    items: [
      { href: '/dashboard/approvals', label: 'Approvals', icon: CheckCircle, badgeKey: 'approvals' },
      { href: '/dashboard/executions', label: 'Executions', icon: List },
      { href: '/dashboard/settlements', label: 'Settlements', icon: ArrowLeftRight },
      { href: '/dashboard/compliance', label: 'Compliance', icon: Scale },
      { href: '/dashboard/audit', label: 'Audit', icon: ScrollText },
      { href: '/dashboard/governance', label: 'Governance', icon: Shield },
      { href: '/dashboard/treasury', label: 'Treasury', icon: Landmark },
      { href: '/dashboard/contracts', label: 'Contracts', icon: Blocks },
      { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
      { href: '/dashboard/team', label: 'Team', icon: Users },
      { href: '/dashboard/agents/studio', label: 'Studio', icon: Bot },
      { href: '/proofs/pack', label: 'Proof Pack', icon: FileCheck },
      { href: '/dashboard/resources', label: 'Resources', icon: BookOpen },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  '/dashboard/wallets': '/dashboard/authority',
  '/dashboard/demo/robinhood': '/dashboard/assets',
  '/dashboard/demo/robinhood-tsla': '/dashboard/assets',
  '/onboarding': '/dashboard',
};

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href.startsWith('/proofs/')) return pathname.startsWith('/proofs/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Resolve the short sidebar label for the current path */
export function navLabelForPath(pathname: string): string | null {
  if (pathname.startsWith('/organization/profile')) return 'Organization Profile';
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (isNavActive(pathname, item.href)) return item.label;
    }
  }
  return null;
}
