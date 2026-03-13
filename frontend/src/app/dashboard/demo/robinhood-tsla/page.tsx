'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ExternalLink, XCircle } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { useExecutions, useMandates } from '@/hooks/use-valen-api';
import {
  BUILDATHON_BASELINE_EXECUTIONS,
  baselineExecutionForChain,
} from '@/lib/buildathon-baseline';

export default function RobinhoodTslaDemoPage() {
  const { data: mandates } = useMandates();
  const { data: executions } = useExecutions({ limit: 50 });
  const robinhoodMandates = mandates?.filter(
    (mandate) => mandate.status === 'active' && mandate.allowedChains.includes(46630),
  ) ?? [];
  const baseline = baselineExecutionForChain(46630);
  const latestRobinhoodProof =
    executions?.items.find(
      (row) => row.targetChainId === 46630 && row.status === 'executed',
    ) ?? executions?.items.find((row) => row.id === baseline?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Robinhood Assets"
        description="Headline tokenized-stock experience — safe TSLA actions with mandate depth, Stylus checks, and settlement proof."
      >
        <ChainBadge chainId={46630} />
        <Link href="/dashboard/executions/new" className="app-btn app-btn-primary">
          Open Intent Builder
          <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      {baseline && (
        <section className="app-card border-[#cfe6ff] bg-[#f8fbff]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#007dfc]">Proven baseline</p>
              <h3 className="mt-1 text-lg font-semibold text-[#012b54]">Latest Robinhood execution proof</h3>
              <p className="mt-2 font-mono text-xs text-[#64748b]">{baseline.id}</p>
              <p className="mt-2 text-sm text-[#64748b]">{baseline.note}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={baseline.proofHref} className="app-btn app-btn-primary">
                Open proof
                <ExternalLink className="h-4 w-4" />
              </Link>
              {latestRobinhoodProof && latestRobinhoodProof.id !== baseline.id && (
                <Link
                  href={`/dashboard/executions/${latestRobinhoodProof.id}/proof`}
                  className="app-btn app-btn-outline"
                >
                  Your latest proof
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="app-card lg:col-span-1">
          <h3 className="app-card-title">Before You Run</h3>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            Switch your wallet to Robinhood Testnet, verify ownership on Fund & Authority, sign a mandate that includes
            chain 46630, then use the Robinhood TSLA Action template.
          </p>
          <div className="mt-4 space-y-3 rounded-2xl bg-[#f8fafc] p-4 text-sm">
            <div>
              <p className="font-semibold text-[#012b54]">Active Robinhood mandates</p>
              <p className="mt-1 text-[#64748b]">{robinhoodMandates.length}</p>
            </div>
            <p className="text-xs leading-5 text-[#64748b]">
              TSLA is a tokenized-asset policy scope label. Settlement relayer delivers native test ETH unless a token
              adapter is deployed in a future phase.
            </p>
          </div>
        </div>

        <div className="app-card">
          <CheckCircle className="h-6 w-6 text-emerald-500" />
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">Safe TSLA Action</h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            A TSLA demo action within signed mandate limits proceeds through compliance, risk, rules, and settlement —
            producing operator-relayed proof with tx hashes and audit trail.
          </p>
          <Link
            href="/dashboard/executions/new?template=robinhood-demo"
            className="app-btn app-btn-outline mt-5"
          >
            Build Allowed Intent
          </Link>
        </div>

        <div className="app-card">
          <XCircle className="h-6 w-6 text-red-500" />
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">Refused / Over-Limit Action</h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            Unsupported chain, blocked subject, or amount above mandate/rule limits stops before settlement. Execution
            detail shows the refusal reason — deeper than a simple allow/block demo.
          </p>
          <Link href="/dashboard/policies/new" className="app-btn app-btn-outline mt-5">
            Tighten Demo Rules
          </Link>
        </div>
      </div>

      <section className="app-card">
        <h3 className="app-card-title">Why judges should compare to Mandate</h3>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Mandate shows allow vs block. VALEN shows the full operating system: identity, signed mandate, Stylus engines,
          settlement txs, and immutable proof — for both Arbitrum USDC and Robinhood tokenized assets.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BUILDATHON_BASELINE_EXECUTIONS.map((row) => (
            <Link key={row.id} href={row.proofHref} className="app-btn app-btn-outline text-sm">
              {row.chainLabel} proof
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
