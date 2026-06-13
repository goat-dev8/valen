'use client';

import Link from 'next/link';
import { Erc8004Badge } from '@/components/app/erc8004-badge';
import { PublicProofDto } from '@/lib/public-proofs';

type PublicProofIdentityPanelProps = {
  proof: PublicProofDto;
};

export function PublicProofIdentityPanel({ proof }: PublicProofIdentityPanelProps) {
  if (!proof.identity) return null;
  return (
    <div className="space-y-3">
      <Erc8004Badge identity={proof.identity} />
      {proof.identity.publicSlug && (
        <Link href={`/agents/${proof.identity.publicSlug}`} className="app-link text-sm">
          View public agent profile
        </Link>
      )}
    </div>
  );
}
