'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

export function CtaSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="get-started" className="landing-section cta-section">
      <div className="landing-container">
        <div ref={ref} className={cn('cta-card', visible && 'scroll-revealed')}>
          <div className="cta-pattern" />
          <h2 className="cta-heading">
            Get ready to transform intents into compliant settlements!
          </h2>
          <p className="cta-desc">
            Ready for policy-powered agentic finance? Get started now with one of our packages today.
          </p>
          <Link href="#pricing" className="cta-btn">
            Get your first insight <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
