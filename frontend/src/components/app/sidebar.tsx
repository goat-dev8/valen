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
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { ValenLogo } from '@/components/brand/valen-logo';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/org-context';
import { useExecutions } from '@/hooks/use-valen-api';

const PRIMARY_FLOW_ITEMS = [
  { href: '/dashboard', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/dashboard/wallets', label: 'Fund & Authority', icon: Wallet },
  { href: '/dashboard/agents', label: 'Agents', icon: Bot },
  { href: '/dashboard/policies', label: 'Rules', icon: FileText },
  { href: '/dashboard/executions', label: 'Activity', icon: Zap },
  { href: '/dashboard/executions/new', label: 'Intent Builder', icon: PlusCircle },
  { href: '/dashboard/demo/robinhood-tsla', label: 'Robinhood Assets', icon: TrendingUp },
];

const EVIDENCE_ADMIN_ITEMS = [
  { href: '/dashboard/approvals', label: 'Approvals', icon: CheckCircle, badgeKey: 'approvals' as const },
  { href: '/dashboard/settlements', label: 'Settlements', icon: ArrowLeftRight },
  { href: '/dashboard/compliance', label: 'Compliance', icon: Scale },
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
  const { organization } = useOrganization();
  const { data: approvals } = useExecutions({ status: 'approval_required', limit: 1 });
  const approvalCount = approvals?.total ?? 0;
  const orgInitials = organization?.name?.slice(0, 2).toUpperCase() ?? 'OR';

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand">
        <ValenLogo href="/dashboard" size="xl" />
      </div>

      <nav className="app-sidebar-nav">
        <div className="app-nav-section">
          <span className="app-nav-label">PRIMARY FLOW</span>
          {PRIMARY_FLOW_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        <div className="app-nav-section">
          <span className="app-nav-label">EVIDENCE & ADMIN</span>
          {EVIDENCE_ADMIN_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={'badgeKey' in item && item.badgeKey === 'approvals' ? approvalCount : undefined}
            />
          ))}
        </div>
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
