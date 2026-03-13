'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CreditCard, Shield } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';

type BudgetSidebarProps = {
  agentName?: string;
  chainId: number;
  resetsAt?: string | null;
};

export function BudgetSidebar({ agentName, chainId, resetsAt }: BudgetSidebarProps) {
  return (
    <aside className="budget-sidebar space-y-5">
      <section className="app-panel-floating budget-sidebar__panel">
        <h3 className="budget-sidebar__title">Selected agent</h3>
        <p className="budget-sidebar__agent">{agentName ?? 'No agent selected'}</p>
        <div className="budget-sidebar__chain">
          <ChainBadge chainId={chainId} />
        </div>
        {resetsAt && (
          <p className="budget-sidebar__reset">
            Window resets <time dateTime={resetsAt}>{new Date(resetsAt).toLocaleString()}</time>
          </p>
        )}
      </section>

      <section className="app-panel-floating budget-sidebar__panel">
        <h3 className="budget-sidebar__title">Related</h3>
        <nav className="budget-sidebar__links">
          <Link href="/dashboard/payments" className="budget-sidebar__link">
            <CreditCard className="h-4 w-4" />
            x402 Payments
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/dashboard/authority" className="budget-sidebar__link">
            <Shield className="h-4 w-4" />
            Authority
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/dashboard/agents/studio" className="budget-sidebar__link">
            <Bot className="h-4 w-4" />
            Agent Studio
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </section>
    </aside>
  );
}
