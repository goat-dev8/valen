'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Scale,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useCountUp } from '@/hooks/use-count-up';

const PIPELINE = [
  { key: 'intent', label: 'Intent', status: 'done' },
  { key: 'policy', label: 'Policy', status: 'done' },
  { key: 'budget', label: 'Budget', status: 'active' },
  { key: 'risk', label: 'Risk', status: 'idle' },
  { key: 'proof', label: 'Proof', status: 'idle' },
] as const;

const EXECUTIONS = [
  { id: '07736a69…', agent: 'valen', action: 'Transfer 0.001 USDC', status: 'approved' as const, chain: 'Sepolia' },
  { id: '1b9d…a02', agent: 'valen', action: 'x402 micropayment', status: 'pending' as const, chain: 'Sepolia' },
  { id: '9b1c…7e2', agent: 'valen', action: 'Transfer TSLA · refused', status: 'blocked' as const, chain: 'RH Testnet' },
  { id: '4e88…91f', agent: 'valen', action: 'Policy v2 published', status: 'approved' as const, chain: 'Sepolia' },
];

const SPARKLINE = [38, 52, 44, 68, 58, 72, 64, 78, 70, 84, 76, 88];

const NAV = [
  { icon: LayoutDashboard, active: true },
  { icon: Bot, active: false },
  { icon: Shield, active: false },
  { icon: Scale, active: false },
  { icon: Activity, active: false },
];

export function HeroDashboardMock() {
  const agents = useCountUp(24, 1200);
  const intents = useCountUp(1847, 1600);
  const passRate = useCountUp(964, 1400);
  const pending = useCountUp(3, 1000);
  const [activeRow, setActiveRow] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveRow((prev) => (prev + 1) % EXECUTIONS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-dashboard-mock">
      <div className="hero-dashboard-chrome">
        <div className="hero-dashboard-dots">
          <span className="hero-dashboard-dot hero-dashboard-dot-red" />
          <span className="hero-dashboard-dot hero-dashboard-dot-yellow" />
          <span className="hero-dashboard-dot hero-dashboard-dot-green" />
        </div>
        <div className="hero-dashboard-chrome-title">
          <span className="hero-dashboard-live">
            <span className="hero-dashboard-live-ping" />
            Live
          </span>
          Compliance &amp; Risk · Home
        </div>
        <span className="hero-dashboard-chain-pill">Arbitrum Sepolia</span>
      </div>

      <div className="hero-dashboard-body">
        <aside className="hero-dashboard-sidebar" aria-hidden="true">
          {NAV.map(({ icon: Icon, active }, i) => (
            <span
              key={i}
              className={`hero-dashboard-nav-item ${active ? 'hero-dashboard-nav-item-active' : ''}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </aside>

        <div className="hero-dashboard-main">
          <div className="hero-dashboard-stats">
            <div className="hero-dashboard-stat">
              <div className="hero-dashboard-stat-top">
                <span className="hero-dashboard-stat-label">Active Agents</span>
                <Bot className="h-4 w-4 text-[#007dfc]" />
              </div>
              <span key={agents} className="hero-dashboard-stat-value">{agents}</span>
              <span className="hero-dashboard-stat-meta hero-dashboard-stat-meta-up">+3 this week</span>
            </div>
            <div className="hero-dashboard-stat">
              <div className="hero-dashboard-stat-top">
                <span className="hero-dashboard-stat-label">Intents Evaluated</span>
                <Activity className="h-4 w-4 text-[#007dfc]" />
              </div>
              <span key={intents} className="hero-dashboard-stat-value">{intents.toLocaleString()}</span>
              <span className="hero-dashboard-stat-meta">Last 24 hours</span>
            </div>
            <div className="hero-dashboard-stat hero-dashboard-stat-accent">
              <div className="hero-dashboard-stat-top">
                <span className="hero-dashboard-stat-label">Pass Rate</span>
                <ShieldCheck className="h-4 w-4 text-white/90" />
              </div>
              <span key={passRate} className="hero-dashboard-stat-value hero-dashboard-stat-value-light">
                {(passRate / 10).toFixed(1)}%
              </span>
              <span className="hero-dashboard-stat-meta hero-dashboard-stat-meta-light">Fail-closed gate</span>
            </div>
            <div className="hero-dashboard-stat">
              <div className="hero-dashboard-stat-top">
                <span className="hero-dashboard-stat-label">Pending Approvals</span>
                <CheckCircle2 className="h-4 w-4 text-[#007dfc]" />
              </div>
              <span key={pending} className="hero-dashboard-stat-value">{pending}</span>
              <span className="hero-dashboard-stat-meta hero-dashboard-stat-meta-warn">Needs review</span>
            </div>
          </div>

          <div className="hero-dashboard-panels">
            <div className="hero-dashboard-panel hero-dashboard-panel-pipeline">
              <div className="hero-dashboard-panel-head">
                <h3>Intent Pipeline</h3>
                <span className="hero-dashboard-panel-tag">#8f2a…c41</span>
              </div>
              <div className="hero-dashboard-pipeline-track">
                <div className="hero-dashboard-pipeline-progress" />
                {PIPELINE.map((step, i) => (
                  <div
                    key={step.key}
                    className={`hero-dashboard-pipeline-node hero-dashboard-pipeline-node-${step.status}`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    <span className="hero-dashboard-pipeline-dot" />
                    <span className="hero-dashboard-pipeline-label">{step.label}</span>
                  </div>
                ))}
              </div>
              <div className="hero-dashboard-sparkline" aria-hidden="true">
                {SPARKLINE.map((h, i) => (
                  <span
                    key={i}
                    className="hero-dashboard-spark-bar"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
            </div>

            <div className="hero-dashboard-panel hero-dashboard-panel-feed">
              <div className="hero-dashboard-panel-head">
                <h3>Recent Executions</h3>
                <span className="hero-dashboard-panel-link">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="hero-dashboard-feed">
                {EXECUTIONS.map((row, i) => (
                  <div
                    key={row.id}
                    className={`hero-dashboard-feed-row ${i === activeRow ? 'hero-dashboard-feed-row-active' : ''}`}
                  >
                    <div className="hero-dashboard-feed-main">
                      <span className="hero-dashboard-feed-agent">{row.agent}</span>
                      <span className="hero-dashboard-feed-action">{row.action}</span>
                    </div>
                    <div className="hero-dashboard-feed-meta">
                      <span className="hero-dashboard-feed-chain">{row.chain}</span>
                      <span className={`hero-dashboard-feed-status hero-dashboard-feed-status-${row.status}`}>
                        {row.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {row.status === 'blocked' && <XCircle className="h-3 w-3" />}
                        {row.status === 'pending' && <Activity className="h-3 w-3" />}
                        {row.status}
                      </span>
                    </div>
                    {i === activeRow && <span className="hero-dashboard-feed-shimmer" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
