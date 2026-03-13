'use client';

import { Bell, Gamepad2, MousePointer2, Settings } from 'lucide-react';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const INTEGRATION_LOGOS = ['A', 'S', 'V', 'B', 'N', 'R', 'E', 'D'];

const STEPS = [
  {
    label: 'Step One',
    title: 'Register your agent',
    desc: 'To get started with VALEN, just create an agent identity.',
    showLabel: true,
    content: (
      <div className="step-mock-form">
        {['Agent name', 'Wallet address', 'Mandate scope', 'Confirm mandate'].map((p) => (
          <div key={p} className="step-mock-input">{p}</div>
        ))}
        <button type="button" className="step-mock-btn">Register</button>
      </div>
    ),
  },
  {
    label: 'Step Two',
    title: 'Integrate your stack',
    desc: 'Connect all your platforms to start seeing compliance analytics.',
    showLabel: false,
    content: (
      <div className="step-mock-integration">
        <div className="step-mock-hub">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <div className="step-mock-logos">
          {INTEGRATION_LOGOS.map((l) => (
            <span key={l} className="step-mock-logo">{l}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Step Three',
    title: 'Monitor everything',
    desc: "Nothing else! You're all done. Now enjoy VALEN on your own.",
    showLabel: true,
    content: (
      <div className="step-mock-list">
        {[
          { Icon: Gamepad2, color: '#007dfc' },
          { Icon: MousePointer2, color: '#22c55e' },
          { Icon: Bell, color: '#a78bfa' },
        ].map(({ Icon, color }, i) => (
          <div key={i} className="step-mock-list-item">
            <span className="step-mock-list-icon" style={{ backgroundColor: color }}>
              <Icon className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-medium text-[#012b54]">Agent Intent</span>
            <span className="ml-auto text-sm text-[#31485f]">$85.45/2.000</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function StepsSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="how-it-works" className="landing-section steps-section">
      <div className="landing-container">
        <div ref={ref} className={cn('steps-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Steps" label="Discover how VALEN works" />
            <h2 className="landing-heading">Get started with our simple 3 step process</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="step-card-wrapper"
                style={{ transitionDelay: visible ? `${i * 0.12}s` : '0s' }}
              >
                {step.showLabel && (
                  <span className="step-handwritten">{step.label}</span>
                )}
                <div className="step-card-inner">
                  <div className="step-mock-card">{step.content}</div>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
