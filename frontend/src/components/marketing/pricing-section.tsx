'use client';

import Link from 'next/link';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Freemium',
    price: '$15',
    period: '/ month',
    desc: 'For solo builders and mini teams, perfect to get started',
    popular: false,
    features: [
      'Compliance automation basics',
      'AI policy assistant',
      'Data encryption (AES-128)',
      'Third-party app integration',
      'Community support forum',
    ],
  },
  {
    name: 'Premium',
    price: '$49',
    period: '/ month',
    desc: 'For startups and mid-sized businesses, ideal for agencies',
    popular: true,
    features: [
      'AI-powered risk categorization',
      'Secure mandate data encryption',
      'Connect with 10 platforms',
      'Email & chat support',
      'Handle 85K intents/month',
      'Export analytics in CSV & PDF',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large companies and enterprises, with advanced features',
    popular: false,
    custom: true,
    features: [
      'Includes all other features',
      'Enterprise compliance data',
      'Custom analytics solutions',
      'Marketing boost insights',
      'Handle 85K+ intents/month',
      '24/7 support + account manager',
    ],
  },
];

export function PricingSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="pricing" className="landing-section pricing-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('pricing-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Pricing" label="Simple pricing for all your needs" />
            <h2 className="landing-heading">Pricing, based on you</h2>
          </div>

          <div className="pricing-grid">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={cn('pricing-card', plan.popular && 'pricing-card-popular')}
                style={{ transitionDelay: visible ? `${i * 0.1}s` : '0s' }}
              >
                {plan.popular && <span className="pricing-badge">MOST POPULAR</span>}
                <div className="pricing-card-top">
                  <span className="pricing-plan-name">{plan.name}</span>
                  <ArrowRight className="h-4 w-4 text-[#31485f]" />
                </div>
                <div className="pricing-price-row">
                  <span className="pricing-price">{plan.price}</span>
                  {plan.period && <span className="pricing-period">{plan.period}</span>}
                </div>
                <p className="pricing-desc">{plan.desc}</p>
                <Link href="#get-started" className={cn('pricing-cta', plan.popular && 'pricing-cta-primary')}>
                  Get Demo <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className="pricing-features">
                  {plan.features.map((f) => (
                    <li key={f} className="pricing-feature">
                      {plan.custom && f.startsWith('Includes') ? (
                        <Plus className="h-4 w-4 shrink-0 text-[#007dfc]" />
                      ) : (
                        <Check className="h-4 w-4 shrink-0 text-[#007dfc]" />
                      )}
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
