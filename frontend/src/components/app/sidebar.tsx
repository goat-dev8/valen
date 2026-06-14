'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ValenLogo } from '@/components/brand/valen-logo';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/org-context';
import { useExecutions } from '@/hooks/use-valen-api';
import { useJudgeMode } from '@/hooks/use-judge-mode';
import { isNavActive, NAV_SECTIONS, type NavItem } from '@/lib/navigation';
import { ChainBadge } from '@/components/app/chain-badge';
import { useConnectedWalletAddress } from '@/hooks/use-connected-wallet-address';
import { shortAddress } from '@/lib/authority-wallet-signing';

const SIDEBAR_CHAIN_IDS = [421614, 46630] as const;

function NavItemLink({
  item,
  badge,
}: {
  item: NavItem;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      prefetch={false}
      className={cn('app-nav-item', active && 'app-nav-item-active')}
      title={item.description}
    >
      <span className="app-nav-item__icon">
        <item.icon className="h-[17px] w-[17px]" aria-hidden />
      </span>
      <span className="app-nav-item__label">{item.label}</span>
      {badge !== undefined && badge > 0 && <span className="app-nav-badge">{badge}</span>}
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { data: approvals } = useExecutions({ status: 'approval_required', limit: 1 });
  const approvalCount = approvals?.total ?? 0;
  const orgInitials = organization?.name?.slice(0, 2).toUpperCase() ?? 'OR';
  const { address: walletAddress } = useConnectedWalletAddress();
  const walletInitials = walletAddress?.slice(2, 4).toUpperCase() ?? orgInitials;
  const judgeMode = useJudgeMode();

  const sections = NAV_SECTIONS.filter((section) => !(judgeMode && section.judgeModeHidden));
  const moreOpen = NAV_SECTIONS.find((s) => s.id === 'advanced')?.items.some((item) =>
    isNavActive(pathname, item.href),
  );

  return (
    <aside className={cn('app-sidebar', className)}>
      <div className="app-sidebar-brand">
        <ValenLogo href="/" size="lg" />
      </div>

      <nav className="app-sidebar-nav" aria-label="Main navigation">
        {sections.map((section) =>
          section.collapsible ? (
            <details key={section.id} className="app-nav-section app-nav-section--collapsible" open={moreOpen}>
              <summary className="app-nav-section__summary">
                <span className="app-nav-label">{section.label}</span>
                <ChevronDown className="app-nav-section__chevron h-4 w-4" aria-hidden />
              </summary>
              <div className="app-nav-section__items">
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    badge={item.badgeKey === 'approvals' ? approvalCount : undefined}
                  />
                ))}
              </div>
            </details>
          ) : (
            <div key={section.id} className="app-nav-section">
              <span className="app-nav-label">{section.label}</span>
              <div className="app-nav-section__items">
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    badge={item.badgeKey === 'approvals' ? approvalCount : undefined}
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </nav>

      <div className="app-sidebar-footer">
        <Link href="/organization/profile" className="app-sidebar-org app-sidebar-org--link app-sidebar-org--premium">
          <div className="app-sidebar-org__avatar">{walletInitials}</div>
          <div className="app-sidebar-org__copy">
            <p className="app-sidebar-org__name">
              {walletAddress ? shortAddress(walletAddress) : (organization?.name ?? 'Organization')}
            </p>
            <div className="app-sidebar-org__chains">
              {SIDEBAR_CHAIN_IDS.map((chainId) => (
                <ChainBadge key={chainId} chainId={chainId} compact />
              ))}
            </div>
            <span className="app-sidebar-org__plan">{organization?.plan ?? 'Development'}</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
