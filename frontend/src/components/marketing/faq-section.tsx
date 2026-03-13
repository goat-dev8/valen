'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { LANDING_FAQS } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const { ref, visible } = useScrollReveal();

  return (
    <section id="faq" className="landing-section faq-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('faq-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="FAQ" label="Documentation-aligned" />
            <h2 className="landing-heading">Common questions about VALEN</h2>
          </div>

          <div className="faq-list">
            {LANDING_FAQS.map((item, i) => (
              <div key={item.q} className={cn('faq-item', open === i && 'faq-item-open')}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={cn('faq-chevron', open === i && 'faq-chevron-open')} />
                </button>
                <div className="faq-answer-wrap">
                  <p className="faq-answer">{item.a}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="faq-contact">
            Full reference in{' '}
            <Link href="/dashboard/resources" className="faq-contact-link">
              Developer Resources <ArrowRight className="inline h-4 w-4" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
