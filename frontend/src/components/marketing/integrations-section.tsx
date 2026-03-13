'use client';

import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { StandardsFeatures } from '@/components/ui/features-5';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

export function IntegrationsSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="integrations" className="landing-section integrations-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('integrations-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Standards" label="Protocol alignment" />
          </div>
          <StandardsFeatures />
        </div>
      </div>
    </section>
  );
}
