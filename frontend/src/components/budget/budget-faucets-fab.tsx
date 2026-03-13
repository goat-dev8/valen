'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Droplets, ExternalLink, Sparkles, X } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { FAUCET_LINKS } from '@/lib/resources';
import { cn } from '@/lib/utils';

const FAUCET_ACCENTS = [
  { glow: 'rgba(0,102,255,0.35)' },
  { glow: 'rgba(13,148,136,0.35)' },
  { glow: 'rgba(16,185,129,0.35)' },
];

export function BudgetFaucetsFab({ inline = false, className }: { inline?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div
      className={cn('budget-faucets-fab', inline && 'budget-faucets-fab--inline', className)}
      ref={panelRef}
    >
      {open && (
        <div className="budget-faucets-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="budget-faucets-panel__glow" aria-hidden />

          <div className="budget-faucets-panel__header">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0066FF]" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF]">Testnet funding</p>
              </div>
              <h2 id={titleId} className="app-section-title mt-1 text-lg text-[#012b54]">
                Faucets
              </h2>
              <p className="mt-1 text-xs text-[#8B98A5]">Fund gas &amp; demo tokens before topping up your agent budget.</p>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-[#8B98A5] transition hover:bg-[#F4F6F8]"
              onClick={() => setOpen(false)}
              aria-label="Close faucets"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="budget-faucets-list">
            {FAUCET_LINKS.map((faucet, index) => {
              const accent = FAUCET_ACCENTS[index % FAUCET_ACCENTS.length];
              return (
                <li key={faucet.label}>
                  <a
                    href={faucet.href}
                    target="_blank"
                    rel="noreferrer"
                    className="budget-faucets-card group"
                    style={{ '--faucet-glow': accent.glow } as CSSProperties}
                  >
                    <span className="budget-faucets-card__icon" aria-hidden>
                      {faucet.iconSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faucet.iconSrc} alt="" width={28} height={28} className="object-contain" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="block text-sm font-bold text-[#012b54] group-hover:text-[#0066FF]">
                          {faucet.label}
                        </span>
                        {faucet.chainId && <ChainBadge chainId={faucet.chainId} />}
                      </span>
                      {faucet.description && (
                        <span className="mt-1 block text-xs leading-relaxed text-[#8B98A5]">{faucet.description}</span>
                      )}
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-[#8B98A5] transition group-hover:text-[#0066FF]" />
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="budget-faucets-panel__footer">
            <Link href="/dashboard/resources" className="text-xs font-bold text-[#0066FF] hover:underline" onClick={() => setOpen(false)}>
              All resources &amp; contract addresses →
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`budget-faucets-trigger ${open ? 'budget-faucets-trigger--open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={titleId}
      >
        <span className="budget-faucets-trigger__shine" aria-hidden />
        <Droplets className="h-4 w-4" aria-hidden />
        <span>Faucets</span>
      </button>
    </div>
  );
}
