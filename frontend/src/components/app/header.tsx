'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Bell, FileCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { useDashboardSummary, useExecutions } from '@/hooks/use-valen-api';

export function AppHeader({ title }: { title?: string }) {
  const router = useRouter();
  const { logout: privyLogout } = usePrivy();
  const { me, logout } = useAuth();
  const { organization } = useOrganization();
  const { data: pendingApprovals } = useExecutions({ status: 'approval_required', limit: 1 });
  const { data: summary } = useDashboardSummary();

  const handleLogout = async () => {
    await privyLogout().catch(() => undefined);
    logout();
    router.push('/login');
  };

  const displayName = me?.user.displayName ?? me?.user.email ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const role = me?.organizations.find((o) => o.id === organization?.id)?.role?.replace(/_/g, ' ') ?? 'Member';
  const approvalCount = pendingApprovals?.total ?? 0;
  const latestProofHref = summary?.latest.proof?.href ?? '/dashboard/executions';

  return (
    <header className="app-header">
      <div className="hidden md:block">
        <p className="text-sm font-medium text-[#012b54]">{organization?.name ?? 'VALEN'}</p>
        <p className="text-xs text-[#64748b]">
          {organization?.defaultChainId === 46630 ? 'Robinhood Testnet' : 'Arbitrum Sepolia'} · Render API
        </p>
      </div>

      <div className="app-header-actions">
        <Link href={latestProofHref} className="hidden items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-xs font-semibold text-[#0f5db8] sm:flex">
          <FileCheck className="h-4 w-4" />
          Latest Proof
        </Link>

        {approvalCount > 0 && (
          <button type="button" className="app-header-icon relative" aria-label="Pending approvals" onClick={() => router.push('/dashboard/approvals')}>
            <Bell className="h-[18px] w-[18px]" />
            <span className="app-header-badge">{approvalCount}</span>
          </button>
        )}

        <button type="button" onClick={handleLogout} className="app-header-icon" aria-label="Logout">
          <LogOut className="h-[18px] w-[18px]" />
        </button>

        <div className="app-header-user">
          <div className="app-header-avatar">{initials}</div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-[#012b54]">{displayName}</p>
            <p className="text-xs capitalize text-[#64748b]">{role}</p>
          </div>
        </div>
      </div>

      {title && <span className="sr-only">{title}</span>}
    </header>
  );
}
