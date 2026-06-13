'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Zap,
  CheckCircle,
  ArrowLeftRight,
  Bot,
  FileText,
  Scale,
  ScrollText,
  Webhook,
  Users,
  Settings,
  ChevronDown,
  Landmark,
  Shield,
  Wallet,
  Blocks,
  FileCheck,
  KeyRound,
  CreditCard,
  BookOpen,
} from 'lucide-react';
import { ValenLogo } from '@/components/brand/valen-logo';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/org-context';
import { useExecutions } from '@/hooks/use-valen-api';

const PRIMARY_ITEMS = [
  { href: '/dashboard', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/dashboard/register-agent', label: 'Create Agent', icon: Bot },
  { href: '/dashboard/policies', label: 'Set Rules', icon: FileText },
  { href: '/dashboard/wallets', label: 'Fund & Authority', icon: Wallet },
  { href: '/dashboard/executions/new', label: 'Execute', icon: Zap },
  { href: '/dashboard/payments', label: 'x402 Payments', icon: CreditCard },
  { href: '/dashboard/executions', label: 'See Proof', icon: FileCheck },
  { href: '/dashboard/demo/robinhood', label: 'Robinhood Assets', icon: KeyRound },
  { href: '/dashboard/resources', label: 'Resources', icon: BookOpen },
];

const ADMIN_ITEMS = [
  { href: '/dashboard/approvals', label: 'Approvals', icon: CheckCircle, badgeKey: 'approvals' as const },
  { href: '/dashboard/settlements', label: 'Settlements', icon: ArrowLeftRight },
  { href: '/dashboard/compliance', label: 'Compliance Evidence', icon: Scale },
  { href: '/dashboard/audit', label: 'Audit Logs', icon: ScrollText },
  { href: '/dashboard/governance', label: 'Governance', icon: Shield },
  { href: '/dashboard/treasury', label: 'Treasury', icon: Landmark },
  { href: '/dashboard/contracts', label: 'Contracts', icon: Blocks },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn('app-nav-item', active && 'app-nav-item-active')}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="app-nav-badge">{badge}</span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { data: approvals } = useExecutions({ status: 'approval_required', limit: 1 });
  const approvalCount = approvals?.total ?? 0;
  const orgInitials = organization?.name?.slice(0, 2).toUpperCase() ?? 'OR';
  const adminOpen = ADMIN_ITEMS.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand">
        <ValenLogo href="/dashboard" size="xl" />
      </div>

      <nav className="app-sidebar-nav">
        <div className="app-nav-section">
          <span className="app-nav-label">PRIMARY JOURNEY</span>
          {PRIMARY_ITEMS.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </div>

        <details className="app-nav-section" open={adminOpen}>
          <summary className="app-nav-label flex cursor-pointer list-none items-center justify-between">
            Evidence & Admin
            <ChevronDown className="h-3.5 w-3.5" />
          </summary>
          <div className="mt-2 space-y-1">
            {ADMIN_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                badge={'badgeKey' in item && item.badgeKey === 'approvals' ? approvalCount : undefined}
              />
            ))}
          </div>
        </details>
      </nav>

      <div className="app-sidebar-footer">
        <div className="app-org-switcher">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#007dfc] text-xs font-bold text-white">
            {orgInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-[#012b54]">{organization?.name ?? 'Organization'}</p>
            <p className="text-xs capitalize text-[#64748b]">{organization?.plan ?? '—'} plan</p>
          </div>
          <ChevronDown className="h-4 w-4 text-[#64748b]" />
        </div>
      </div>
    </aside>
  );
}
