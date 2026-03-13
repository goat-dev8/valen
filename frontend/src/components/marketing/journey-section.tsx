'use client';

import Link from 'next/link';
import { ArrowRight, Bot, FileCheck, Shield, Zap } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { JOURNEY_STEPS } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

function JourneyMock({ kind }: { kind: (typeof JOURNEY_STEPS)[number]['mock'] }) {
  if (kind === 'login') {
    return (
      <div className="journey-mock journey-mock--login">
        <div className="journey-mock-pill">Privy auth</div>
        <div className="journey-mock-line journey-mock-line--wide" />
        <div className="journey-mock-line" />
        <div className="journey-mock-btn">Get Started</div>
      </div>
    );
  }
  if (kind === 'home') {
    return (
      <div className="journey-mock journey-mock--pipeline">
        {['Intent', 'Policy', 'Budget', 'Risk', 'Proof'].map((s, i) => (
          <span key={s} className={cn('journey-mock-node', i <= 2 && 'journey-mock-node--active')}>
            {s}
          </span>
        ))}
      </div>
    );
  }
  if (kind === 'studio') {
    return (
      <div className="journey-mock journey-mock--studio">
        <Bot className="h-5 w-5 text-[#007dfc]" />
        <span>Identity → Rules → Authority → Budget → Publish</span>
      </div>
    );
  }
  if (kind === 'authority') {
    return (
      <div className="journey-mock journey-mock--authority">
        <Shield className="h-5 w-5 text-[#007dfc]" />
        <span>EIP-712 mandate signed</span>
        <span className="journey-mock-check">✓</span>
      </div>
    );
  }
  if (kind === 'intent') {
    return (
      <div className="journey-mock journey-mock--intent">
        <Zap className="h-5 w-5 text-[#007dfc]" />
        <span>0.001 USDC · transfer</span>
      </div>
    );
  }
  if (kind === 'proof') {
    return (
      <div className="journey-mock journey-mock--proof">
        <FileCheck className="h-5 w-5 text-[#007dfc]" />
        <span className="journey-mock-mono">proofs/executions/…</span>
      </div>
    );
  }
  return (
    <div className="journey-mock">
      <div className="journey-mock-line journey-mock-line--wide" />
      <div className="journey-mock-line" />
    </div>
  );
}

export function JourneySection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="how-it-works" className="landing-section journey-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('journey-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Journey" label="Connect to proof in 7 steps" />
            <h2 className="landing-heading">From login to public proof</h2>
            <p className="journey-desc">
              The same path judges and operators follow in production — mirrored in Agent Studio and Home setup
              progress.
            </p>
          </div>

          <div className="journey-track" aria-hidden="true">
            <div className="journey-track-line">
              <div className={cn('journey-track-fill', visible && 'journey-track-fill--active')} />
            </div>
          </div>

          <div className="journey-grid">
            {JOURNEY_STEPS.map((step, i) => (
              <Link
                key={step.step}
                href={step.route}
                className="journey-card"
                style={{ transitionDelay: visible ? `${i * 0.08}s` : '0s' }}
              >
                <span className="journey-card__step">{step.step}</span>
                <div className="journey-card__mock">
                  <JourneyMock kind={step.mock} />
                </div>
                <h3 className="journey-card__title">{step.title}</h3>
                <p className="journey-card__desc">{step.desc}</p>
                <span className="journey-card__cta">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
