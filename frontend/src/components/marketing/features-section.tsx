'use client';

import Link from 'next/link';
import { ArrowRight, LayoutDashboard, PieChart, FileCheck, Shield } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { DASHBOARD_FEATURES } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

const FEATURE_ICONS = [LayoutDashboard, PieChart, FileCheck, Shield] as const;

export function FeaturesSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="features" className="landing-section features-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('features-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="App" label="Command-first UX" />
            <h2 className="landing-heading">The dashboard matches the pipeline</h2>
            <p className="features-section-desc">
              Home, Agent Studio, Proof Center, and Authority — the same surfaces operators use in production.
            </p>
          </div>
          <div className="features-grid features-grid--app">
            {DASHBOARD_FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? LayoutDashboard;
              return (
                <div
                  key={f.title}
                  className="features-card features-card--app"
                  style={{ transitionDelay: visible ? `${i * 0.1}s` : '0s' }}
                >
                  <div className="features-card-top">
                    <span className="features-app-icon">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="features-app-tag">{f.tag}</span>
                  </div>
                  <h3 className="features-card-title">{f.title}</h3>
                  <p className="features-card-desc">{f.desc}</p>
                  <Link href="/login" className="features-app-link">
                    Open dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
