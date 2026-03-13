'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { AUDIENCE_CARDS } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

export function AudienceSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="audience" className="landing-section audience-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('audience-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Who it's for" label="Open infrastructure" />
            <h2 className="landing-heading">Built for the agentic finance stack</h2>
            <p className="audience-desc">
              VALEN is infrastructure — deploy agents safely on Arbitrum-class chains and Robinhood Chain with
              audit-grade evidence from day one.
            </p>
          </div>

          <div className="audience-grid">
            {AUDIENCE_CARDS.map((card, i) => (
              <div
                key={card.title}
                className="audience-card"
                style={{ transitionDelay: visible ? `${i * 0.1}s` : '0s' }}
              >
                <h3 className="audience-card__title">{card.title}</h3>
                <p className="audience-card__desc">{card.desc}</p>
                {card.external ? (
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="audience-card__cta"
                  >
                    {card.cta}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link href={card.href} className="audience-card__cta">
                    {card.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="audience-quote">
            <blockquote>
              &ldquo;Proof is the product.&rdquo; Other systems move money. VALEN proves money moved{' '}
              <em>correctly</em> — or proves it <em>correctly refused</em> to move.
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
