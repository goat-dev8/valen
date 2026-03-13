'use client';

import { Fingerprint } from 'lucide-react';
import { Erc8004Badge } from '@/components/app/erc8004-badge';
import { TechnicalDisclosure } from '@/components/ui/technical-disclosure';
import type { AgentIdentityDto } from '@/types/api';

export function IdentityCard({
  agentId,
  agentName,
  publicSlug,
  identity,
}: {
  agentId: string;
  agentName: string;
  publicSlug?: string | null;
  identity?: AgentIdentityDto | null;
}) {
  const erc8004 = identity?.erc8004;
  const registered = erc8004?.status === 'registered';

  return (
    <section className="rounded-2xl border border-[#0066FF]/15 bg-gradient-to-br from-[#EBF2FF]/40 to-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066FF]/10 text-[#0066FF]">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0066FF]">ERC-8004 Identity</p>
            <h3 className="text-lg font-semibold text-[#1A2332]">{agentName}</h3>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Erc8004Badge identity={erc8004} agentId={agentId} publicSlug={publicSlug} />
      </div>

      <TechnicalDisclosure title="Technical identity details">
        <dl className="grid gap-2 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-[#8B98A5]">Agent ID</dt>
            <dd className="font-mono text-[#1A2332]">{agentId}</dd>
          </div>
          {erc8004?.tokenId && (
            <div className="flex justify-between gap-2">
              <dt className="text-[#8B98A5]">Token ID</dt>
              <dd className="font-mono text-[#1A2332]">{erc8004.tokenId}</dd>
            </div>
          )}
          {registered && publicSlug && (
            <div className="flex justify-between gap-2">
              <dt className="text-[#8B98A5]">Public slug</dt>
              <dd className="font-mono text-[#1A2332]">{publicSlug}</dd>
            </div>
          )}
        </dl>
      </TechnicalDisclosure>
    </section>
  );
}
