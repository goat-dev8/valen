'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const NOTIFICATIONS = [
  { user: '@Agent-42', action: 'Intent approved by compliance', time: '15 min ago' },
  { user: '@Policy', action: 'Risk threshold updated: 0.72 → 0.65', time: '32 min ago' },
  { user: '@Audit', action: 'Settlement logged on Arbitrum Sepolia', time: '1 hr ago' },
  { user: '@Mandate', action: 'New spending cap enforced for wallet', time: '2 hr ago' },
];

export function NotificationSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="landing-section notification-section">
      <div className="notification-bg-grid" />
      <div className="landing-container relative z-10">
        <div ref={ref} className={cn('notification-grid', visible && 'scroll-revealed')}>
          <div className="notification-copy">
            <SectionBadge suffix="Know More" label="Smart Notification" />
            <h2 className="landing-heading text-left">
              Smart notification alerts across your compliance layer
            </h2>
            <p className="notification-desc">
              Integrate VALEN with your team&apos;s stack and create a powerful compliance hub that
              fits seamlessly with the way you work.
            </p>
            <Link href="#get-started" className="btn-primary inline-flex items-center gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="notification-mockup">
            <div className="notification-window">
              <div className="notification-window-bar">
                <div className="flex gap-1.5">
                  <span className="window-dot window-dot-red" />
                  <span className="window-dot window-dot-yellow" />
                  <span className="window-dot window-dot-green" />
                </div>
                <span className="text-xs text-[#31485f]">VALEN Activity</span>
              </div>
              <div className="notification-window-body">
                <div className="notification-tabs">
                  <span className="notification-tab notification-tab-active">Inbox 82</span>
                  <span className="notification-tab">Activities</span>
                  <span className="notification-tab">Policies</span>
                </div>
                <div className="notification-header-row">
                  <span className="font-semibold text-[#012b54]">All Activities</span>
                  <span className="text-sm text-[#007dfc]">See All</span>
                </div>
                <div className="notification-list">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.time + n.user} className="notification-item">
                      <div className="notification-avatar" />
                      <div className="flex-1">
                        <p className="text-sm text-[#012b54]">
                          <strong>{n.user}</strong> {n.action}
                        </p>
                        <span className="text-xs text-[#31485f]">{n.time}</span>
                      </div>
                      <div className="notification-placeholder" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
