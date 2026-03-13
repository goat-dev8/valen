'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProofBackLink } from '@/components/proof/proof-back-link';
import { QueryState } from '@/components/app/query-state';
import { PaymentProofView } from '@/components/proof/payment-proof-view';
import { fetchPublicProof } from '@/lib/public-proofs';

export default function PublicPaymentProofPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-proof-payment', id],
    queryFn: () => fetchPublicProof('payments', id),
  });

  return (
    <div className="public-proof-page">
      <ProofBackLink fallbackHref="/dashboard/proofs" fallbackLabel="Outcome Ledger" />
      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && <PaymentProofView proof={data} proofUrl={`/proofs/payments/${id}`} />}
      </QueryState>
    </div>
  );
}
