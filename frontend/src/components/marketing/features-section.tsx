'use client';

import type { CSSProperties } from 'react';
import { ChevronDown, Download, Eye, Users } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useCountUp } from '@/hooks/use-count-up';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

function AttributionCard() {
  const total = useCountUp(2150);
  const sepolia = useCountUp(1470, 1600);
  const robinhood = useCountUp(680, 1800);
  const barHeights = [32, 44, 28, 56, 40, 64, 36, 52, 48, 60, 42, 50];

  return (
    <div className="feature-mock-card feature-mock-card-live">
      <div className="feature-mock-header">
        <div className="flex items-center gap-2 text-sm font-medium text-[#012b54]">
          <Users className="h-4 w-4 text-[#007dfc] feature-mock-icon-pulse" />
          Mandate Checks
        </div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3 feature-mock-chevron" />
        </button>
      </div>
      <div className="feature-mock-metric">
        <span key={total} className="feature-mock-number feature-mock-number-live">{total.toLocaleString()}</span>
        <span className="feature-mock-badge feature-mock-badge-green feature-mock-badge-pulse">+5%</span>
      </div>
      <div className="feature-mock-rows">
        <div className="feature-mock-row feature-mock-row-float" style={{ animationDelay: '0.1s' }}>
          <span>Arbitrum Sepolia</span>
          <span className="font-semibold text-[#012b54]">{sepolia.toLocaleString()}</span>
          <span className="feature-mock-badge feature-mock-badge-green text-xs">+8.5%</span>
        </div>
        <div className="feature-mock-row feature-mock-row-float" style={{ animationDelay: '0.55s' }}>
          <span>Robinhood Chain</span>
          <span className="font-semibold text-[#012b54]">{robinhood.toLocaleString()}</span>
          <span className="feature-mock-badge feature-mock-badge-orange text-xs">-4.2%</span>
        </div>
      </div>
      <div className="feature-mock-chart">
        <div className="feature-mock-bars">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="feature-mock-bar feature-mock-bar-animated"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
        <svg className="feature-mock-line" viewBox="0 0 200 60" preserveAspectRatio="none">
          <path
            className="feature-mock-line-path feature-mock-line-draw"
            d="M0,45 C30,40 50,20 80,25 C110,30 130,10 160,18 C180,22 190,15 200,12"
            fill="none"
            stroke="#007dfc"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </div>
  );
}

function InsightsCard() {
  const score = useCountUp(850);
  const bars = [
    { label: '23%', color: '#f5c518', up: true, delay: '0s' },
    { label: '47%', color: '#a78bfa', up: true, delay: '0.15s' },
    { label: '13%', color: '#22d3ee', up: false, delay: '0.3s' },
  ];

  return (
    <div className="feature-mock-card feature-mock-card-live">
      <div className="feature-mock-header">
        <div className="flex items-center gap-2 text-sm font-medium text-[#012b54]">
          <Eye className="h-4 w-4 text-[#007dfc] feature-mock-icon-pulse" />
          Risk Score
        </div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3 feature-mock-chevron" />
        </button>
      </div>
      <div className="feature-mock-metric">
        <span key={score} className="feature-mock-number feature-mock-number-live">{score}</span>
        <span className="feature-mock-badge feature-mock-badge-orange feature-mock-badge-pulse">-3% on avg.</span>
      </div>
      <div className="feature-mock-devices">
        {[
          { label: 'Low', value: '28%' },
          { label: 'Medium', value: '16%' },
          { label: 'High', value: '56%' },
        ].map((item, i) => (
          <div key={item.label} className="feature-mock-stat-float" style={{ animationDelay: `${i * 0.35}s` }}>
            <span className="text-xs text-[#31485f]">{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="feature-mock-bar-chart">
        {bars.map((b) => (
          <div key={b.label} className="feature-mock-bar-col">
            <div
              className="feature-mock-bar-fill feature-mock-bar-fill-animated is-active"
              style={{ backgroundColor: b.color, '--bar-height': b.label, animationDelay: b.delay } as CSSProperties}
            />
            <span className="text-xs font-semibold text-[#012b54]">{b.label}</span>
            <span className={cn('text-xs', b.up ? 'text-emerald-500' : 'text-orange-500')}>
              {b.up ? '↑' : '↓'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareCard() {
  const score = useCountUp(88);
  const policyA = useCountUp(64, 1500);
  const policyB = useCountUp(92, 1700);

  return (
    <div className="feature-mock-card feature-mock-card-live">
      <div className="feature-mock-header">
        <div className="text-sm font-medium text-[#012b54]">Settlement Performance</div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3 feature-mock-chevron" />
        </button>
      </div>
      <div className="feature-mock-metric">
        <span key={score} className="feature-mock-number feature-mock-number-live">{score}</span>
        <span className="feature-mock-badge feature-mock-badge-green feature-mock-badge-pulse">Good</span>
      </div>
      <div className="feature-mock-progress-list">
        <div className="feature-mock-progress-item">
          <div className="flex justify-between text-sm text-[#31485f]">
            <span>Policy A</span>
            <span className="font-semibold text-[#012b54]">{policyA}</span>
          </div>
          <div className="feature-mock-progress-track">
            <div
              className="feature-mock-progress-fill is-active"
              style={{ width: `${policyA}%`, animationDelay: '0.1s' }}
            />
          </div>
        </div>
        <div className="feature-mock-progress-item">
          <div className="flex justify-between text-sm text-[#31485f]">
            <span>Policy B</span>
            <span className="font-semibold text-[#012b54]">{policyB}</span>
          </div>
          <div className="feature-mock-progress-track">
            <div
              className="feature-mock-progress-fill feature-mock-progress-fill-accent is-active"
              style={{ width: `${policyB}%`, animationDelay: '0.25s' }}
            />
          </div>
        </div>
      </div>
      <p className="feature-mock-callout feature-mock-callout-float">
        Policy B consistently delivers exceptional settlement rates across key risk areas.
      </p>
    </div>
  );
}

function ReportsCard() {
  const volume = useCountUp(110);
  const intents = useCountUp(126, 1600);

  return (
    <div className="feature-mock-card feature-mock-card-live">
      <div className="feature-mock-header">
        <div className="text-sm font-medium text-[#012b54]">Audit Reports</div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3 feature-mock-chevron" />
        </button>
      </div>
      <p className="text-sm text-[#31485f]">Schedule email reports, export PDFs, team sharing</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f8f9fb] p-3 feature-mock-stat-float" style={{ animationDelay: '0.05s' }}>
          <div className="text-xs text-[#31485f]">Net Volume</div>
          <div className="text-xl font-semibold text-[#012b54]">{volume}k</div>
          <div className="text-xs text-emerald-500">+USD</div>
        </div>
        <div className="rounded-xl bg-[#f8f9fb] p-3 feature-mock-stat-float" style={{ animationDelay: '0.35s' }}>
          <div className="text-xs text-[#31485f]">Total Intents</div>
          <div className="text-xl font-semibold text-[#012b54]">{(intents / 10).toFixed(1)}k</div>
          <div className="text-xs text-[#31485f]">/month</div>
        </div>
      </div>
      <div className="feature-mock-download feature-mock-download-float">
        <div className="flex items-center gap-2 text-sm text-[#012b54]">
          <Download className="h-4 w-4 text-[#007dfc] feature-mock-icon-pulse" />
          Compliance_Report.xlsx
        </div>
        <span className="text-xs text-[#31485f]">3 PM</span>
        <span className="feature-mock-download-shimmer" aria-hidden="true" />
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: 'Effortless mandate enforcement',
    desc: 'Enhancing and simplifying compliance for agentic finance',
    Card: AttributionCard,
  },
  {
    title: 'Measure real-time risk',
    desc: 'Simplifying risk scoring for clarity and impact.',
    Card: InsightsCard,
  },
  {
    title: 'Compare settlement paths',
    desc: 'Analyze outcomes to measure policy success.',
    Card: CompareCard,
  },
  {
    title: 'Custom audit reports',
    desc: 'Schedule email reports, export PDFs, team sharing',
    Card: ReportsCard,
  },
];

export function FeaturesSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="features" className="landing-section features-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('features-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Features" label="Explore our offerings" />
            <h2 className="landing-heading">Analyze every intent like never before</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="features-card"
                style={{ transitionDelay: visible ? `${i * 0.1}s` : '0s' }}
              >
                <div className="features-card-top">
                  <h3 className="features-card-title">{f.title}</h3>
                  <p className="features-card-desc">{f.desc}</p>
                </div>
                <f.Card />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
