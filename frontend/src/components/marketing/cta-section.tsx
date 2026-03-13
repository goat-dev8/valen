'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

export function CtaSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="get-started" className="landing-section cta-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('cta-card', visible && 'scroll-revealed')}>
          <div className="cta-pattern" />
          <h2 className="cta-heading">Deploy governed agents on live testnets today</h2>
          <p className="cta-desc">
            Connect → Agent Studio → Policy → Authority → Intent → Proof. Every refusal is as valuable as
            every settlement.
          </p>
          <div className="cta-actions">
            <Link href="/login" className="cta-btn">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/proofs/pack" className="cta-btn cta-btn--ghost">
              View proof pack <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
