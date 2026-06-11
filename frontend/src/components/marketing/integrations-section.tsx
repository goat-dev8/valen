'use client';

import { Settings } from 'lucide-react';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const INTEGRATIONS = [
  { label: 'V', color: '#007dfc', angle: -75 },
  { label: 'S', color: '#012b54', angle: -45 },
  { label: 'G', color: '#8b5cf6', angle: -20 },
  { label: 'g', color: '#22c55e', angle: 20 },
  { label: 'R', color: '#3b82f6', angle: 45 },
  { label: 'A', color: '#6366f1', angle: 75 },
];

export function IntegrationsSection() {
  const { ref, visible } = useScrollReveal();
  const radius = 140;

  return (
    <section id="integrations" className="landing-section integrations-section">
      <div className="integrations-bg-grid" />
      <div className="integrations-glow" />
      <div className="landing-container relative z-10">
        <div ref={ref} className={cn('integrations-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Integrations" label="Connect with platform" />
            <h2 className="landing-heading">Integrate with your overall workflow</h2>
            <p className="integrations-desc">
              Integrate VALEN with your team&apos;s stack and create a powerful compliance insights
              hub that fits seamlessly with the way you work.
            </p>
          </div>

          <div className="integrations-visual">
            <svg className="integrations-arc" viewBox="-200 -120 400 200">
              <path
                d="M -170 40 Q 0 -80 170 40"
                fill="none"
                stroke="#e8ebf0"
                strokeWidth="1.5"
                strokeDasharray="6 6"
              />
            </svg>
            <div className="integrations-hub">
              <div className="integrations-hub-glow" />
              <div className="integrations-hub-icon">
                <Settings className="h-10 w-10 text-white" strokeWidth={1.8} />
              </div>
            </div>
            {INTEGRATIONS.map((item) => {
              const rad = (item.angle * Math.PI) / 180;
              const x = Math.sin(rad) * radius;
              const y = -Math.cos(rad) * radius * 0.55 + 20;
              return (
                <div
                  key={item.label}
                  className="integrations-orbit-icon"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    backgroundColor: item.color,
                  }}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
