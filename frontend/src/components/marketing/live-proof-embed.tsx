'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileCheck } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { fetchProofPack, type ProofPackDto } from '@/lib/public-proofs';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

/** Live proof samples on marketing landing — proof as product. */
export function LiveProofEmbed() {
  const { ref, visible } = useScrollReveal(0.12);
  const [data, setData] = useState<ProofPackDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchProofPack()
      .then((pack) => {
        if (!cancelled) {
          setData(pack);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const samples = data
    ? [
        {
          kind: 'Settled',
          item: data.executions[0],
          href: data.executions[0] ? `/proofs/executions/${data.executions[0].id}` : '/proofs/pack',
        },
        {
          kind: 'Refused',
          item: data.refusals[0],
          href: data.refusals[0] ? `/proofs/refusals/${data.refusals[0].id}` : '/proofs/pack',
        },
        {
          kind: 'x402',
          item: data.payments[0],
          href: data.payments[0] ? `/proofs/payments/${data.payments[0].id}` : '/proofs/pack',
        },
      ]
    : [];

  return (
    <section className="live-proof-section">
      <div className="container py-16">
        <div ref={ref} className={cn('live-proof-card', visible && 'scroll-revealed')}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#007dfc]">Proof as product</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#012b54]">
                Live outcomes from production testnets
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748b]">
                Execution proofs, refusal receipts, and x402 payment proofs — public URLs with evidence hashes,
                mandate linkage, and ERC-8004 identity. No login required.
              </p>
            </div>
            <Link href="/proofs/pack" className="btn-primary inline-flex items-center gap-2">
              Open proof pack
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {isLoading && <p className="mt-6 text-sm text-[#64748b]">Loading latest proofs…</p>}
          {error && (
            <p className="mt-6 text-sm text-[#64748b]">
              Proof pack unavailable —{' '}
              <Link href="/proofs/pack" className="font-semibold text-[#007dfc]">
                open proof pack
              </Link>
              .
            </p>
          )}

          {samples.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {samples.map(({ kind, item, href }, i) => (
                <Link
                  key={kind}
                  href={href}
                  className="live-proof-module"
                  style={{ transitionDelay: visible ? `${0.1 + i * 0.08}s` : '0s' }}
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#007dfc]" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{kind}</span>
                  </div>
                  {item ? (
                    <>
                      <div className="mt-3 flex items-center gap-2">
                        <AssetIcon symbol={item.asset ?? 'USDC'} size={24} />
                        <span className="text-sm font-semibold capitalize text-[#012b54]">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-[10px] text-[#94a3b8]">{item.id.slice(0, 16)}…</p>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-[#64748b]">Sample pending</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
