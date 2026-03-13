'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { DUAL_CHAIN_DEMOS } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

export function CaseStudiesSection() {
  const [active, setActive] = useState(0);
  const { ref, visible } = useScrollReveal();
  const current = DUAL_CHAIN_DEMOS[active];

  return (
    <section id="demos" className="landing-section case-studies-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('case-studies-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Live Demos" label="Production-verified" />
            <h2 className="landing-heading">Dual-chain outcomes you can verify</h2>
          </div>

          <div className={cn('case-study-card case-study-card--demo', `bg-gradient-to-r ${current.gradient}`)}>
            <div className="case-study-visual">
              <div className="case-study-chart-mock case-study-chart-mock--pipeline">
                <div className="case-study-pipeline-nodes">
                  {['Mandate', 'Engines', 'Budget', 'Gate', 'Proof'].map((node, i) => (
                    <span
                      key={node}
                      className={cn('case-study-pipeline-node', i <= 3 && 'case-study-pipeline-node--lit')}
                    >
                      {node}
                    </span>
                  ))}
                </div>
                <span className="case-study-logo">{current.chain}</span>
              </div>
            </div>
            <div className="case-study-info">
              <p className="case-study-headline">{current.headline}</p>
              <p className="case-study-quote">{current.quote}</p>
              <div className="case-study-stats">
                <div>
                  <div className="case-study-stat-value">{current.statA.value}</div>
                  <div className="case-study-stat-label">{current.statA.label}</div>
                </div>
                <div>
                  <div className="case-study-stat-value">{current.statB.value}</div>
                  <div className="case-study-stat-label">{current.statB.label}</div>
                </div>
              </div>
              <Link href="/proofs/pack" className="case-study-cta">
                Open proof pack <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="case-study-tabs">
            {DUAL_CHAIN_DEMOS.map((demo, i) => (
              <button
                key={demo.chain}
                type="button"
                className={cn('case-study-tab', i === active && 'case-study-tab--active')}
                onClick={() => setActive(i)}
              >
                {demo.chain}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
