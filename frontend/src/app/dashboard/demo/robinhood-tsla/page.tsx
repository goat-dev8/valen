'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { useMandates } from '@/hooks/use-valen-api';

export default function RobinhoodTslaDemoPage() {
  const { data: mandates } = useMandates();
  const robinhoodMandates = mandates?.filter(
    (mandate) => mandate.status === 'active' && mandate.allowedChains.includes(46630),
  ) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Robinhood TSLA Demo"
        description="Run allowed and refused TSLA scenarios through the same mandate, policy, and proof pipeline."
      >
        <ChainBadge chainId={46630} />
        <Link href="/dashboard/executions/new" className="app-btn app-btn-primary">
          Open Intent Builder
          <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="app-card lg:col-span-1">
          <h3 className="app-card-title">Before You Run It</h3>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            Switch your wallet to Robinhood Testnet in the wallet UI, verify ownership, sign a mandate that includes
            Robinhood Testnet, then use the Robinhood Demo Intent template.
          </p>
          <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm">
            <p className="font-semibold text-[#012b54]">Active Robinhood mandates</p>
            <p className="mt-1 text-[#64748b]">{robinhoodMandates.length}</p>
          </div>
        </div>

        <div className="app-card">
          <CheckCircle className="h-6 w-6 text-emerald-500" />
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">Allowed Scenario</h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            A TSLA demo action on Robinhood Testnet within the signed mandate limits should proceed through checks and
            eventually produce a VALEN operator-relayed proof.
          </p>
          <Link href="/dashboard/executions/new" className="app-btn app-btn-outline mt-5">
            Build Allowed Intent
          </Link>
        </div>

        <div className="app-card">
          <XCircle className="h-6 w-6 text-red-500" />
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">Refused Scenario</h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            An unsupported chain, blocked subject, or amount above the mandate/policy limit should stop before
            settlement and show the failure reason in execution detail.
          </p>
          <Link href="/dashboard/policies/new" className="app-btn app-btn-outline mt-5">
            Review Demo Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
