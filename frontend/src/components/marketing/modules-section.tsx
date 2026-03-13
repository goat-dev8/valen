'use client';

import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { RadialOrbitalTimeline } from '@/components/ui/radial-orbital-timeline';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { buildModuleTimelineData } from '@/lib/module-timeline-data';
import { cn } from '@/lib/utils';

const MODULE_TIMELINE = buildModuleTimelineData();

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

          <RadialOrbitalTimeline timelineData={MODULE_TIMELINE} />
        </div>
      </div>
    </section>
  );
}
