'use client';

import Link from 'next/link';
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react';

export function PolicyExplainer() {
  return (
    <section className="policy-explainer app-panel-floating">
      <div className="policy-explainer__grid">
        <div>
          <p className="policy-explainer__eyebrow">Intent evaluation</p>
          <h2 className="policy-explainer__title">Rules that gate every governed action before settlement.</h2>
          <p className="policy-explainer__desc">
            Policies bind compliance, risk, and permission rules to agent intents at evaluation time. Publish a version,
            activate it, then assign the policy to agents in Agent Studio or on the agent detail page.
          </p>
          <div className="policy-explainer__steps">
            <div className="policy-explainer__step">
              <span className="policy-explainer__step-num">1</span>
              <div>
                <p className="policy-explainer__step-title">Create from template</p>
                <p className="policy-explainer__step-desc">Start with a permission preset for transfers, demos, or custom flows.</p>
              </div>
            </div>
            <div className="policy-explainer__step">
              <span className="policy-explainer__step-num">2</span>
              <div>
                <p className="policy-explainer__step-title">Publish & activate</p>
                <p className="policy-explainer__step-desc">Versioned rules with an immutable hash for audit and proof linkage.</p>
              </div>
            </div>
            <div className="policy-explainer__step">
              <span className="policy-explainer__step-num">3</span>
              <div>
                <p className="policy-explainer__step-title">Assign to agents</p>
                <p className="policy-explainer__step-desc">Each intent is checked against the agent&apos;s default policy at runtime.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="policy-explainer__aside">
          <div className="policy-explainer__callout">
            <ShieldCheck className="h-5 w-5 text-[#0066FF]" aria-hidden />
            <p className="policy-explainer__callout-title">Fail-closed by default</p>
            <p className="policy-explainer__callout-desc">
              Refusals are intentional outcomes — they produce public proof that governance blocked an unauthorized action.
            </p>
          </div>
          <Link href="/dashboard/policies/new" className="app-btn app-btn-primary policy-explainer__cta">
            <FileText className="h-4 w-4" />
            Create policy
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard/agents/studio" className="app-btn app-btn-outline policy-explainer__cta">
            Assign in Agent Studio
          </Link>
        </aside>
      </div>
    </section>
  );
}
