'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { ProofVerificationSteps } from '@/components/proof/proof-verification-steps';

type FeaturedProof = {
  href: string;
  label: string;
  executionId?: string;
};

export function ProofLedgerExplainer({ featured }: { featured?: FeaturedProof | null }) {
  return (
    <div className="proof-ledger-intro grid gap-5 lg:grid-cols-[1fr_0.95fr]">
      <section className="app-panel-floating p-5 md:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF]">Verifiable record</p>
        <h2 className="app-section-title mt-2 text-xl text-[#012b54] md:text-2xl">
          Every governed action leaves a public, auditable trail.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#5E6C7B]">
          Settled transfers, intentional refusals, and in-flight intents each map to a shareable proof URL with on-chain
          evidence — so auditors, partners, and your team can verify outcomes without trusting a black box.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <p className="mt-2 text-sm font-semibold text-emerald-900">Settled proofs</p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              On-chain settlement tx, mandate hash, and agent identity in one URL.
            </p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <p className="mt-2 text-sm font-semibold text-red-900">Refusal proofs</p>
            <p className="mt-1 text-xs leading-5 text-red-800">
              Blocked actions are first-class outcomes — they prove governance worked.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/proofs/pack" className="app-btn btn-proof text-sm">
            Public Proof Pack
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard/executions" className="app-btn app-btn-outline text-sm">
            Execution log
          </Link>
        </div>
      </section>

      <div className="space-y-5">
        {featured?.href && (
          <section className="proof-ledger-featured">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF]">Latest proof</p>
            <h3 className="mt-2 text-lg font-bold text-[#012b54]">{featured.label}</h3>
            {featured.executionId && (
              <p className="mt-1 font-mono text-xs text-[#8B98A5]">{featured.executionId}</p>
            )}
            <Link href={featured.href} className="app-btn btn-proof mt-4 text-sm">
              Open proof
              <ExternalLink className="h-4 w-4" />
            </Link>
          </section>
        )}
        <ProofVerificationSteps />
      </div>
    </div>
  );
}
