'use client';

import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { VALEN_LOGO_SRC } from '@/components/brand/valen-logo';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const INTEGRATIONS = [
  {
    name: 'Arbitrum',
    x: -168,
    y: 54,
    scale: 0.72,
    opacity: 0.48,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M12 3L3 18h6l3-6 3 6h6L12 3z" fill="#28A0F0" />
      </svg>
    ),
  },
  {
    name: 'Supabase',
    x: -108,
    y: 24,
    scale: 0.86,
    opacity: 0.74,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M12 3L4 20h5l3-8 3 8h5L12 3z" fill="#3ECF8E" />
      </svg>
    ),
  },
  {
    name: 'NestJS',
    x: -54,
    y: 4,
    scale: 0.96,
    opacity: 0.92,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M12 4c-3 0-5 2-5 5v6c0 3 2 5 5 5s5-2 5-5V9c0-3-2-5-5-5zm0 2c1.7 0 3 1.3 3 3v6c0 1.7-1.3 3-3 3s-3-1.3-3-3V9c0-1.7 1.3-3 3-3z" fill="#E0234E" />
      </svg>
    ),
  },
  {
    name: 'Redis',
    x: 54,
    y: 4,
    scale: 0.96,
    opacity: 0.92,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="7" fill="#DC382D" />
        <circle cx="12" cy="12" r="3" fill="#fff" />
      </svg>
    ),
  },
  {
    name: 'Viem',
    x: 108,
    y: 24,
    scale: 0.86,
    opacity: 0.74,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M6 5h4l2 14 2-14h4L14 21h-4L6 5z" fill="#8B5CF6" />
      </svg>
    ),
  },
  {
    name: 'Stylus',
    x: 168,
    y: 54,
    scale: 0.72,
    opacity: 0.48,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" fill="#012B54" />
      </svg>
    ),
  },
];

const BG_SQUARES = [
  { left: '8%', top: '18%', size: 72, opacity: 0.35 },
  { left: '22%', top: '62%', size: 56, opacity: 0.25 },
  { left: '68%', top: '24%', size: 64, opacity: 0.3 },
  { left: '78%', top: '58%', size: 48, opacity: 0.22 },
  { left: '42%', top: '72%', size: 40, opacity: 0.18 },
];

export function IntegrationsSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="integrations" className="landing-section integrations-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="integrations-bg-shapes" aria-hidden="true">
        {BG_SQUARES.map((square, i) => (
          <span
            key={i}
            className="integrations-bg-square"
            style={{
              left: square.left,
              top: square.top,
              width: square.size,
              height: square.size,
              opacity: square.opacity,
            }}
          />
        ))}
      </div>
      <div className="integrations-glow" />
      <div className="landing-container">
        <div ref={ref} className={cn('integrations-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Standards" label="Protocol alignment" />
            <h2 className="landing-heading">Built on emerging agentic finance standards</h2>
            <p className="integrations-desc">
              ERC-8226 mandates, ERC-8004 identity, x402 payments, Stylus engines, and dual-chain settlement —
              unified under one fail-closed pipeline.
            </p>
          </div>

          <div className="integrations-visual">
            <svg className="integrations-arc" viewBox="-200 -90 400 180" aria-hidden="true">
              <path
                d="M -178 58 Q 0 -62 178 58"
                fill="none"
                stroke="#d8dee8"
                strokeWidth="1.5"
                strokeDasharray="5 7"
                strokeLinecap="round"
              />
            </svg>

            <div className="integrations-hub">
              <div className="integrations-hub-glow" />
              <div className="integrations-hub-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={VALEN_LOGO_SRC} alt="" className="integrations-hub-logo" />
              </div>
            </div>

            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="integrations-orbit-icon"
                style={{
                  transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px)) scale(${item.scale})`,
                  opacity: item.opacity,
                }}
                title={item.name}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
