'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { LANDING_MODULES } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

export function ModulesSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="modules" className="landing-section modules-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('modules-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Core Modules" label="Infrastructure primitives" />
            <h2 className="landing-heading">Permission, evaluation, and proof — as modules</h2>
            <p className="modules-desc">
              VALEN is not a wallet or DEX. It is the governed execution rail: each module enforces a gate
              before autonomous agents reach settlement.
            </p>
          </div>

          <div className="modules-grid">
            {LANDING_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.id}
                  href={mod.route}
                  className="landing-module-card"
                  style={{
                    transitionDelay: visible ? `${i * 0.07}s` : '0s',
                    ['--module-accent' as string]: mod.accent,
                  }}
                >
                  <div className="landing-module-card__glow" aria-hidden="true" />
                  <div className="landing-module-card__top">
                    <span className="landing-module-card__icon">
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="landing-module-card__tag">{mod.tag}</span>
                  </div>
                  <h3 className="landing-module-card__title">{mod.title}</h3>
                  <p className="landing-module-card__desc">{mod.description}</p>
                  <span className="landing-module-card__link">
                    Explore <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
