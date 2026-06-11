'use client';

import { ChevronDown, Download, Eye, Users } from 'lucide-react';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

function AttributionCard() {
  return (
    <div className="feature-mock-card">
      <div className="feature-mock-header">
        <div className="flex items-center gap-2 text-sm font-medium text-[#012b54]">
          <Users className="h-4 w-4 text-[#007dfc]" />
          Mandate Checks
        </div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="feature-mock-metric">
        <span className="feature-mock-number">2,150</span>
        <span className="feature-mock-badge feature-mock-badge-green">+5%</span>
      </div>
      <div className="feature-mock-rows">
        <div className="feature-mock-row">
          <span>Arbitrum Sepolia</span>
          <span className="font-semibold text-[#012b54]">1,470</span>
          <span className="feature-mock-badge feature-mock-badge-green text-xs">+8.5%</span>
        </div>
        <div className="feature-mock-row">
          <span>Robinhood Chain</span>
          <span className="font-semibold text-[#012b54]">680</span>
          <span className="feature-mock-badge feature-mock-badge-orange text-xs">-4.2%</span>
        </div>
      </div>
      <div className="feature-mock-chart">
        <div className="feature-mock-bars">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="feature-mock-bar" style={{ height: `${20 + (i % 5) * 12}%` }} />
          ))}
        </div>
        <svg className="feature-mock-line" viewBox="0 0 200 60" preserveAspectRatio="none">
          <path
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
  const bars = [
    { label: '23%', color: '#f5c518', up: true },
    { label: '13%', color: '#22d3ee', up: false },
    { label: '47%', color: '#a78bfa', up: true },
  ];

  return (
    <div className="feature-mock-card">
      <div className="feature-mock-header">
        <div className="flex items-center gap-2 text-sm font-medium text-[#012b54]">
          <Eye className="h-4 w-4 text-[#007dfc]" />
          Risk Score
        </div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="feature-mock-metric">
        <span className="feature-mock-number">850</span>
        <span className="feature-mock-badge feature-mock-badge-orange">-3% on avg.</span>
      </div>
      <div className="feature-mock-devices">
        <div><span className="text-xs text-[#31485f]">Low</span><strong>28%</strong></div>
        <div><span className="text-xs text-[#31485f]">Medium</span><strong>16%</strong></div>
        <div><span className="text-xs text-[#31485f]">High</span><strong>56%</strong></div>
      </div>
      <div className="feature-mock-bar-chart">
        {bars.map((b) => (
          <div key={b.label} className="feature-mock-bar-col">
            <div className="feature-mock-bar-fill" style={{ backgroundColor: b.color, height: b.label }} />
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
  return (
    <div className="feature-mock-card">
      <div className="feature-mock-header">
        <div className="text-sm font-medium text-[#012b54]">Settlement Performance</div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="feature-mock-metric">
        <span className="feature-mock-number">88</span>
        <span className="feature-mock-badge feature-mock-badge-green">Good</span>
      </div>
      <div className="feature-mock-rows">
        <div className="feature-mock-row">
          <span>Policy A</span>
          <span className="font-semibold text-[#012b54]">64</span>
          <span className="text-xs text-[#31485f]">Average</span>
        </div>
        <div className="feature-mock-row">
          <span>Policy B</span>
          <span className="font-semibold text-[#012b54]">92</span>
          <span className="feature-mock-badge feature-mock-badge-green text-xs">+12%</span>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-[#f0f6ff] px-3 py-2 text-sm text-[#31485f]">
        Policy B consistently delivers exceptional settlement rates across key risk areas.
      </p>
    </div>
  );
}

function ReportsCard() {
  return (
    <div className="feature-mock-card">
      <div className="feature-mock-header">
        <div className="text-sm font-medium text-[#012b54]">Audit Reports</div>
        <button type="button" className="feature-mock-dropdown">
          Weekly <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <p className="text-sm text-[#31485f]">Schedule email reports, export PDFs, team sharing</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f8f9fb] p-3">
          <div className="text-xs text-[#31485f]">Net Volume</div>
          <div className="text-xl font-semibold text-[#012b54]">110k</div>
          <div className="text-xs text-emerald-500">+USD</div>
        </div>
        <div className="rounded-xl bg-[#f8f9fb] p-3">
          <div className="text-xs text-[#31485f]">Total Intents</div>
          <div className="text-xl font-semibold text-[#012b54]">12.6k</div>
          <div className="text-xs text-[#31485f]">/month</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-[#eef0f3] px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-[#012b54]">
          <Download className="h-4 w-4 text-[#007dfc]" />
          Compliance_Report.xlsx
        </div>
        <span className="text-xs text-[#31485f]">3 PM</span>
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
    <section id="features" className="landing-section features-section">
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
