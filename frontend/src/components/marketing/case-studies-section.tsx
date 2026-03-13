'use client';

import { useState } from 'react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const CASES = [
  {
    company: 'Arbitrum Sepolia',
    quote: 'A DeFi protocol uses VALEN to monitor agent intents across all settlement paths.',
    monthly: '96%',
    yearly: '98%',
    monthlyLabel: 'Compliance Pass Rate',
    yearlyLabel: 'Audit Coverage',
    gradient: 'from-[#e8f0ff] to-white',
  },
  {
    company: 'Robinhood Testnet',
    quote: 'Our team integrates VALEN to track and analyze risk across all agent workflows.',
    monthly: '92%',
    yearly: '96%',
    monthlyLabel: 'Risk Reduction',
    yearlyLabel: 'Policy Adherence',
    gradient: 'from-[#eef8ff] to-white',
  },
  {
    company: 'Stylus Engines',
    quote: 'VALEN provides insights that help brands improve their agentic finance strategy.',
    monthly: '90%',
    yearly: '94%',
    monthlyLabel: 'Settlement Success',
    yearlyLabel: 'Mandate Enforcement',
    gradient: 'from-[#f0f4ff] to-white',
  },
];

export function CaseStudiesSection() {
  const [active, setActive] = useState(0);
  const { ref, visible } = useScrollReveal();
  const current = CASES[active];

  return (
    <section id="case-study" className="landing-section case-studies-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('case-studies-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Case Studies" label="Stories that inspire" />
            <h2 className="landing-heading">Successful Deployments</h2>
          </div>

          <div className={cn('case-study-card', `bg-gradient-to-r ${current.gradient}`)}>
            <div className="case-study-visual">
              <div className="case-study-chart-mock">
                <div className="case-study-bars">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="case-study-bar" style={{ height: `${30 + (i % 4) * 15}%` }} />
                  ))}
                </div>
                <svg viewBox="0 0 200 80" className="case-study-line" preserveAspectRatio="none">
                  <path
                    d="M0,60 C40,55 60,30 100,35 C140,40 160,15 200,20"
                    fill="none"
                    stroke="#007dfc"
                    strokeWidth="3"
                  />
                </svg>
                <span className="case-study-logo">{current.company}</span>
              </div>
            </div>
            <div className="case-study-info">
              <p className="case-study-quote">{current.quote}</p>
              <div className="case-study-stats">
                <div>
                  <div className="case-study-stat-value">{current.monthly}</div>
                  <div className="case-study-stat-label">{current.monthlyLabel}</div>
                </div>
                <div>
                  <div className="case-study-stat-value">{current.yearly}</div>
                  <div className="case-study-stat-label">{current.yearlyLabel}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="case-study-dots">
            {CASES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to case study ${i + 1}`}
                className={cn('case-study-dot', i === active && 'case-study-dot-active')}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
