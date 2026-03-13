'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ChevronRight, ShieldCheck, Wallet } from 'lucide-react';

type AuthorityExplainerProps = {
  verifyComplete: boolean;
  mandateComplete: boolean;
  activePanel: 'verify' | 'mandate' | null;
  onOpenVerify: () => void;
  onOpenMandate: () => void;
};

export function AuthorityExplainer({
  verifyComplete,
  mandateComplete,
  activePanel,
  onOpenVerify,
  onOpenMandate,
}: AuthorityExplainerProps) {
  return (
    <section className="authority-explainer app-panel-floating">
      <div className="authority-explainer__grid">
        <div>
          <p className="authority-explainer__eyebrow">Owner authority</p>
          <h2 className="authority-explainer__title">Prove wallet ownership, then sign scoped agent mandates.</h2>
          <p className="authority-explainer__desc">
            VALEN requires a verified owner wallet and an active signed mandate before any governed intent can settle.
            Verification is a proof-only signature — it does not move funds.
          </p>
        </div>

        <div className="authority-explainer__actions">
          <button
            type="button"
            className={`authority-explainer__action ${activePanel === 'verify' ? 'authority-explainer__action--active' : ''} ${verifyComplete ? 'authority-explainer__action--done' : ''}`}
            onClick={onOpenVerify}
          >
            <span className="authority-explainer__action-icon">
              {verifyComplete ? <CheckCircle className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
            </span>
            <span className="authority-explainer__action-copy">
              <span className="authority-explainer__action-title">Verify wallet</span>
              <span className="authority-explainer__action-desc">
                {verifyComplete ? 'Owner wallet verified on this chain' : 'Sign a one-time ownership challenge'}
              </span>
            </span>
            <ChevronRight className="authority-explainer__action-chevron h-4 w-4" aria-hidden />
          </button>

          <button
            type="button"
            className={`authority-explainer__action ${activePanel === 'mandate' ? 'authority-explainer__action--active' : ''} ${mandateComplete ? 'authority-explainer__action--done' : ''}`}
            onClick={onOpenMandate}
          >
            <span className="authority-explainer__action-icon">
              {mandateComplete ? <CheckCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </span>
            <span className="authority-explainer__action-copy">
              <span className="authority-explainer__action-title">Sign mandate</span>
              <span className="authority-explainer__action-desc">
                {mandateComplete ? 'Active mandate on file' : 'Bind an agent to policy limits and expiry'}
              </span>
            </span>
            <ChevronRight className="authority-explainer__action-chevron h-4 w-4" aria-hidden />
          </button>

          <Link href="/dashboard/executions/new" className="app-btn app-btn-outline authority-explainer__cta">
            Governed Intent
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
