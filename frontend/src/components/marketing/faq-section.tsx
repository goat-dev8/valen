'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'What kind of compliance metrics can I track?',
    a: 'You can track mandate enforcement, risk scores, settlement success rates, policy violations, agent intent volumes, audit trail completeness, and more. All dashboards are fully customizable to fit your goals.',
  },
  {
    q: 'Does it integrate with my existing tools?',
    a: 'VALEN is compatible with leading analytics, CRM, and onchain platforms including Arbitrum, Stylus engines, Supabase, and Redis. We use industry-standard encryption and GDPR-compliant protocols.',
  },
  {
    q: 'What support channels are available?',
    a: 'We offer multi-channel support including live chat, email assistance, and a dedicated help center with documentation and video tutorials. Priority support is available for premium users.',
  },
  {
    q: 'Do you offer a free trial?',
    a: 'Yes, we offer a 14-day free trial with access to all core features. No credit card is required to get started—you can explore the platform risk-free on testnet.',
  },
  {
    q: 'Do you offer onboarding support?',
    a: 'Yes, all new users receive onboarding support including setup guidance, best practice resources, and access to a dedicated onboarding specialist for larger teams.',
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const { ref, visible } = useScrollReveal();

  return (
    <section id="faq" className="landing-section faq-section">
      <div className="landing-container">
        <div ref={ref} className={cn('faq-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="FAQs" label="Questions you might have" />
            <h2 className="landing-heading">
              Questions?
              <br />
              We&apos;re Glad You Asked.
            </h2>
          </div>

          <div className="faq-list">
            {FAQS.map((item, i) => (
              <div key={item.q} className={cn('faq-item', open === i && 'faq-item-open')}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={cn('faq-chevron', open === i && 'faq-chevron-open')} />
                </button>
                <div className="faq-answer-wrap">
                  <p className="faq-answer">{item.a}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="faq-contact">
            Haven&apos;t found a solution? Feel free to{' '}
            <Link href="#get-started" className="faq-contact-link">
              Contact Us <ArrowRight className="inline h-4 w-4" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
