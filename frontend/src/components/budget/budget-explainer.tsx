'use client';

import Link from 'next/link';
import { ArrowRight, Droplets, PieChart, ShieldAlert } from 'lucide-react';

export function BudgetExplainer() {
  return (
    <section className="budget-explainer app-panel-floating">
      <div className="budget-explainer__grid">
        <div>
          <p className="budget-explainer__eyebrow">Spending caps</p>
          <h2 className="budget-explainer__title">USDC budgets gate every governed payment before settlement.</h2>
          <p className="budget-explainer__desc">
            Each agent carries a rolling 24-hour USDC cap. When spend exceeds the cap, VALEN refuses the action and
            produces public proof — the same fail-closed model as policy and mandate checks.
          </p>
          <div className="budget-explainer__steps">
            <div className="budget-explainer__step">
              <span className="budget-explainer__step-num">1</span>
              <div>
                <p className="budget-explainer__step-title">Set a cap</p>
                <p className="budget-explainer__step-desc">Define the maximum USDC your agent can spend per window.</p>
              </div>
            </div>
            <div className="budget-explainer__step">
              <span className="budget-explainer__step-num">2</span>
              <div>
                <p className="budget-explainer__step-title">Top up</p>
                <p className="budget-explainer__step-desc">Add to the cap when you need more headroom for test flows.</p>
              </div>
            </div>
            <div className="budget-explainer__step">
              <span className="budget-explainer__step-num">3</span>
              <div>
                <p className="budget-explainer__step-title">Fund testnet</p>
                <p className="budget-explainer__step-desc">Use faucets for gas and demo tokens before settling on-chain.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="budget-explainer__aside">
          <div className="budget-explainer__callout budget-explainer__callout--warn">
            <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden />
            <p className="budget-explainer__callout-title">Refusals are proof</p>
            <p className="budget-explainer__callout-desc">
              Budget refusals block settlement early and map to auditable outcomes in the Outcome Ledger.
            </p>
          </div>
          <div className="budget-explainer__callout">
            <PieChart className="h-5 w-5 text-[#0066FF]" aria-hidden />
            <p className="budget-explainer__callout-title">DB + vault</p>
            <p className="budget-explainer__callout-desc">
              Database budgets enforce refusals for all agents. ValenBudgetVault on Arbitrum Sepolia applies to the demo
              agent scope.
            </p>
          </div>
          <p className="budget-explainer__faucet-hint">
            <Droplets className="inline h-3.5 w-3.5 text-[#0066FF]" aria-hidden /> Use the{' '}
            <strong>Faucets</strong> button bottom-right to fund testnet wallets.
          </p>
          <Link href="/dashboard/payments" className="app-btn app-btn-primary budget-explainer__cta">
            x402 Payments
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
