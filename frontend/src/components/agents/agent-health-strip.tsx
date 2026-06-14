'use client';

import { ChainBadge } from '@/components/app/chain-badge';

type AgentHealthStripProps = {
  mandateOk: boolean;
  policyOk: boolean;
  budgetOk?: boolean;
  identityStatus?: string;
  proofCount?: number;
  lastExecution?: string | null;
};

export function AgentHealthStrip({
  mandateOk,
  policyOk,
  budgetOk,
  identityStatus,
  proofCount = 0,
  lastExecution,
}: AgentHealthStripProps) {
  const identityOk = identityStatus === 'registered';

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mandateOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
        Mandate {mandateOk ? 'Active' : 'Pending'}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${policyOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
        Policy {policyOk ? 'Active' : 'Pending'}
      </span>
      {budgetOk != null && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${budgetOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
          Budget {budgetOk ? 'Funded' : 'Empty'}
        </span>
      )}
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${identityOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
        Identity {identityOk ? 'Registered' : 'Pending'}
      </span>
      <span className="rounded-full bg-[#EBF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#0066FF]">
        {proofCount} proofs
      </span>
      {lastExecution && (
        <span className="rounded-full bg-[#F4F6F8] px-2 py-0.5 text-[10px] font-semibold text-[#5E6C7B]">
          Last {new Date(lastExecution).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

export function AgentNetworksRow({ chainIds }: { chainIds: number[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chainIds.map((chainId) => (
        <ChainBadge key={chainId} chainId={chainId} />
      ))}
    </div>
  );
}
