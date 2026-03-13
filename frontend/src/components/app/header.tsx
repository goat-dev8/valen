'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Bell, FileCheck, LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { useDashboardSummary, useExecutions } from '@/hooks/use-valen-api';
import { navLabelForPath, OUTCOME_LEDGER_NAV_LABEL } from '@/lib/navigation';

export function AppHeader({
  title,
  onMenuClick,
  onSearchClick,
}: {
  title?: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
  const latestProofHref = summary?.latest.proof?.href ?? '/dashboard/proofs';
  const currentPage = navLabelForPath(pathname) ?? title ?? 'Home';

  return (
    <header className="app-header">
      <div className="app-header__start">
        <button
          type="button"
          className="app-header-icon lg:hidden"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <div className="app-header__context">
          <p className="app-header__org">{organization?.name ?? 'VALEN'}</p>
          <p className="app-header__page">{currentPage}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onSearchClick}
        className="app-header-search-pill hidden md:flex"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4 shrink-0 text-[#8B98A5]" aria-hidden />
        <span>Search pages & actions</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="app-header-actions">
        <button
          type="button"
          onClick={onSearchClick}
          className="app-header-icon md:hidden"
          aria-label="Open command palette"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <Link
          href={latestProofHref.startsWith('/proofs') ? latestProofHref : '/dashboard/proofs'}
          className="app-header-chip app-header-chip--proof hidden sm:inline-flex"
        >
          <FileCheck className="h-4 w-4" aria-hidden />
          {OUTCOME_LEDGER_NAV_LABEL}
        </Link>

        {approvalCount > 0 && (
          <button
            type="button"
            className="app-header-icon relative"
            aria-label="Pending approvals"
            onClick={() => router.push('/dashboard/approvals')}
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="app-header-badge">{approvalCount}</span>
          </button>
        )}

        <div className="app-header-user">
          <div className="app-header-avatar">{initials}</div>
          <div className="hidden md:block">
            <p className="app-header-user__name">{displayName}</p>
            <p className="app-header-user__role">{role}</p>
          </div>
        </div>

        <button type="button" onClick={handleLogout} className="app-header-icon" aria-label="Log out">
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
