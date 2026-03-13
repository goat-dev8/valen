'use client';

import { GridWallpaper } from '@/components/marketing/grid-wallpaper';

const PARTNERS = [
  { name: 'Arbitrum', mark: '◆' },
  { name: 'Stylus', mark: '⬡' },
  { name: 'Supabase', mark: '▣' },
  { name: 'NestJS', mark: '◎' },
  { name: 'Solidity', mark: '◇' },
  { name: 'Robinhood', mark: '◈' },
  { name: 'Viem', mark: '⬢' },
  { name: 'Redis', mark: '▤' },
  { name: 'BullMQ', mark: '◉' },
  { name: 'Render', mark: '◐' },
  { name: 'Sepolia', mark: '◑' },
  { name: 'Audit', mark: '◒' },
];

function MarqueeRow() {
  const items = [...PARTNERS, ...PARTNERS];
  return (
    <div className="partners-marquee-row">
      {items.map((partner, i) => (
        <div key={`${partner.name}-${i}`} className="partners-logo-item">
          <span className="partners-logo-mark" aria-hidden="true">
            {partner.mark}
          </span>
          <span className="partners-logo-text">{partner.name}</span>
        </div>
      ))}
    </div>
  );
}

export function PartnersSection() {
  return (
    <section className="partners-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div className="partners-content">
          <p className="partners-label">Production stack · Arbitrum Stylus · Robinhood Chain · NestJS · Supabase</p>
          <div className="partners-marquee-outer">
            <div className="partners-fade-left" aria-hidden="true" />
            <div className="partners-fade-right" aria-hidden="true" />
            <div className="partners-marquee-track">
              <MarqueeRow />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
