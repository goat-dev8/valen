'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, FileCheck, Menu, Search } from 'lucide-react';
import { UserMenu } from '@/components/app/user-menu';
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
  const { organization } = useOrganization();
  const { data: pendingApprovals } = useExecutions({ status: 'approval_required', limit: 1 });
  const { data: summary } = useDashboardSummary();

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

        <UserMenu />
      </div>
    </header>
  );
}
