'use client';

import Link from 'next/link';
import { ArrowRight, FileCheck } from 'lucide-react';

type CommandHeroProps = {
  latestProofHref?: string | null;
  setupComplete: boolean;
  onRunAction?: () => void;
};

export function CommandHero({ latestProofHref, setupComplete }: CommandHeroProps) {
  return (
    <section className="command-hero rounded-3xl border border-[#dbeafe] bg-gradient-to-br from-[#f8fbff] to-white p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#007dfc]">Governed Agent Finance</p>
      <h2 className="mt-3 font-serif text-2xl font-semibold text-[#012b54] md:text-3xl">
        Every agent action → public proof
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
        VALEN binds wallet authority, signed mandates, rules, budgets, and on-chain settlement so every autonomous
        finance action ends with a verifiable proof URL — approved or refused.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={latestProofHref ?? '/proofs/pack'}
          className="app-btn btn-proof inline-flex items-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          Open Latest Proof
        </Link>
        <Link href="/dashboard/executions/new" className="app-btn app-btn-primary inline-flex items-center gap-2">
          Governed Intent
          <ArrowRight className="h-4 w-4" />
        </Link>
        {!setupComplete && (
          <Link href="/dashboard/agents" className="app-btn app-btn-outline">
            Complete Setup
          </Link>
        )}
      </div>
    </section>
  );
}
