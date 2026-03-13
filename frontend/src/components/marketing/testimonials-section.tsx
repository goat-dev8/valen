'use client';

import { Star } from 'lucide-react';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const STATS = [
  { value: '1200+', label: 'Reviews' },
  { value: '4.9', label: 'On Product Hunt', stars: true },
  { value: '1.4M+', label: 'Total Intents' },
];

const TESTIMONIALS = [
  {
    name: 'Kristin Watson',
    company: 'Louis Vuitton',
    quote:
      'Our compliance reports used to be cobbled together from five different platforms. Now we just open VALEN. It saves our team over 10 hours a week.',
    tall: true,
  },
  {
    name: 'Brooklyn Simmons',
    company: 'eBay',
    quote:
      'VALEN has been a total game-changer. Everything is in one place — mandate checks, risk scoring, settlement audit. We\'ve seen a 37% lift in compliant transactions.',
    tall: false,
  },
  {
    name: 'Cody Fisher',
    company: 'General Electric',
    quote: 'Cut our risk exposure by 35% in two months. Clear, actionable insights every day.',
    tall: false,
  },
  {
    name: 'Dianne Russell',
    company: 'McDonalds',
    quote:
      'This doesn\'t just give you data—it gives you direction. The real-time analytics and policy insights helped us cut settlement failures by 35% in just two months.',
    tall: true,
  },
  {
    name: 'Floyd Miles',
    company: 'Pizza Hut',
    quote: 'Data-rich, stress-free, and beautifully designed. Cut our CAC by 35% in two months.',
    tall: false,
  },
  {
    name: 'Cameron Williamson',
    company: 'Nintendo',
    quote:
      'VALEN gave us exactly what we were missing: clarity. With real-time insights and seamless integrations, we finally understand what\'s working.',
    tall: true,
  },
  {
    name: 'Bessie Cooper',
    company: 'Walmart',
    quote: 'VALEN turned our data chaos into clear, confident decisions. Our team runs faster and smarter.',
    tall: false,
  },
  {
    name: 'Devon Lane',
    company: 'Johnson & Johnson',
    quote:
      'VALEN simplified our entire agentic workflow. Within two months, we reduced non-compliant settlements by 35%.',
    tall: true,
  },
  {
    name: 'Ronnie Cooper',
    company: 'MasterCard',
    quote: 'The audit trail alone is worth the switch. Every intent is traceable end to end.',
    tall: false,
  },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('');
  const hues = [210, 230, 250, 200, 180];
  const hue = hues[name.length % hues.length];

  return (
    <div
      className="testimonial-avatar"
      style={{ backgroundColor: `hsl(${hue}, 70%, 55%)` }}
    >
      {initials}
    </div>
  );
}

export function TestimonialsSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="landing-section testimonials-section">
      <div className="landing-container">
        <div ref={ref} className={cn('testimonials-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Testimonials" label="Not just words, see results" />
            <h2 className="landing-heading">Trusted by teams building agentic finance.</h2>
          </div>

          <div className="testimonials-stats">
            {STATS.map((s, i) => (
              <div key={s.label} className="testimonials-stat">
                <div className="testimonials-stat-value">
                  {s.value}
                  {s.stars && (
                    <span className="ml-2 inline-flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-[#007dfc] text-[#007dfc]" />
                      ))}
                    </span>
                  )}
                </div>
                <div className="testimonials-stat-label">{s.label}</div>
                {i < STATS.length - 1 && <div className="testimonials-stat-divider" />}
              </div>
            ))}
          </div>

          <div className="testimonials-masonry">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={cn('testimonial-card', t.tall && 'testimonial-card-tall')}
                style={{ transitionDelay: visible ? `${0.05 * i}s` : '0s' }}
              >
                <div className="testimonial-card-header">
                  <Avatar name={t.name} />
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-company">{t.company}</div>
                  </div>
                </div>
                <p className="testimonial-quote">{t.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
