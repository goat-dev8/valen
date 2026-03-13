'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const NOTIFICATIONS = [
  { user: 'Execution', action: 'USDC transfer settled on Arbitrum Sepolia', time: 'Just now' },
  { user: 'Refusal', action: 'TSLA transfer blocked — POLICY_CAP_EXCEEDED', time: '12 min ago' },
  { user: 'Approval', action: 'High-risk intent awaiting owner signature', time: '28 min ago' },
  { user: 'x402', action: 'Micropayment proof published with evidence hash', time: '1 hr ago' },
];

export function NotificationSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="landing-section notification-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('notification-grid', visible && 'scroll-revealed')}>
          <div className="notification-copy">
            <SectionBadge suffix="Alerts" label="Fail-closed feedback" />
            <h2 className="landing-heading text-left">
              Approvals, refusals, and settlements — in real time
            </h2>
            <p className="notification-desc">
              When risk tier requires human oversight, approvers get in-app alerts. Every blocked intent still
              produces a public refusal receipt.
            </p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2">
              Open dashboard <ArrowRight className="h-4 w-4" />
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
                <span className="text-xs text-[#31485f]">VALEN · Outcomes</span>
              </div>
              <div className="notification-window-body">
                <div className="notification-tabs">
                  <span className="notification-tab notification-tab-active">Proofs 3</span>
                  <span className="notification-tab">Approvals 1</span>
                  <span className="notification-tab">Audit</span>
                </div>
                <div className="notification-header-row">
                  <span className="font-semibold text-[#012b54]">Latest outcomes</span>
                  <span className="text-sm text-[#007dfc]">Proof pack</span>
                </div>
                <div className="notification-list">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.time + n.user} className="notification-item notification-item--slide">
                      <div className="notification-avatar notification-avatar--pulse" />
                      <div className="flex-1">
                        <p className="text-sm text-[#012b54]">
                          <strong>{n.user}</strong> · {n.action}
                        </p>
                        <span className="text-xs text-[#31485f]">{n.time}</span>
                      </div>
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
