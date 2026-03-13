'use client';

import Image from 'next/image';
import {
  Bot,
  CheckCircle2,
  CreditCard,
  FileCheck,
  Home,
  Scale,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useCountUp } from '@/hooks/use-count-up';

const NAV = [
  { section: 'Overview', items: [{ label: 'Home', icon: Home, active: true }] },
  { section: 'Agents', items: [{ label: 'Agents', icon: Bot, active: false }] },
  {
    section: 'Actions',
    items: [
      { label: 'Intent', icon: Zap, active: false },
      { label: 'Payments', icon: CreditCard, active: false },
    ],
  },
  { section: 'Proofs', items: [{ label: 'Proofs', icon: FileCheck, active: false }] },
  { section: 'Control', items: [{ label: 'Policies', icon: Scale, active: false }] },
];

const AGENTS = [
  { name: 'valen', status: 'Active', tone: 'active' as const },
  { name: 'ZENITH', status: 'Active', tone: 'active' as const },
  { name: 'NeuraXchange', status: 'Setup pending', tone: 'pending' as const },
];

const CHIPS = ['Pay 1 USDC', 'Create treasury agent', 'Show latest proofs', 'Transfer 1 TSLA to wallet'];

/** Command Center preview — mirrors the live dashboard hero (image2) */
export function HeroDashboardMock() {
  const budget = useCountUp(649, 1400);
  const spent = useCountUp(51, 1200);
  const passRate = useCountUp(40, 1000);
  const agents = useCountUp(8, 900);

  return (
    <div className="hero-dashboard-mock">
      <div className="hero-dashboard-app">
        <aside className="hero-dashboard-app-sidebar" aria-hidden="true">
          <div className="hero-dashboard-app-brand">
            <Image src="/valen-logo.svg" alt="" width={22} height={22} className="hero-dashboard-app-logo" />
            <span className="hero-dashboard-app-wordmark">VALEN</span>
          </div>

          <nav className="hero-dashboard-app-nav">
            {NAV.map(({ section, items }) => (
              <div key={section} className="hero-dashboard-app-nav-group">
                <p className="hero-dashboard-app-nav-label">{section}</p>
                {items.map(({ label, icon: Icon, active }) => (
                  <span
                    key={label}
                    className={`hero-dashboard-app-nav-item ${active ? 'hero-dashboard-app-nav-item-active' : ''}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            ))}
          </nav>

          <div className="hero-dashboard-app-wallet">
            <span className="hero-dashboard-app-wallet-addr">0xD208…171A</span>
            <div className="hero-dashboard-app-wallet-chains">
              <Image src="/arbitrum-logo.png" alt="" width={16} height={16} />
              <Image src="/robinhood.svg" alt="" width={16} height={16} />
            </div>
          </div>
        </aside>

        <div className="hero-dashboard-app-main">
          <div className="hero-dashboard-app-topbar">
            <span className="hero-dashboard-app-crumb">MY ORGANIZATION / Home</span>
            <span className="hero-dashboard-app-search">
              <Search className="h-3.5 w-3.5" />
              Search pages &amp; actions
            </span>
            <span className="hero-dashboard-app-topbar-actions">
              <span className="hero-dashboard-app-topbar-btn">Proofs</span>
              <span className="hero-dashboard-app-avatar">U</span>
            </span>
          </div>

          <div className="hero-dashboard-app-content">
            <div className="hero-dashboard-app-header">
              <div>
                <h3 className="hero-dashboard-app-title">Command Center</h3>
                <p className="hero-dashboard-app-subtitle">
                  Governed autonomous agents — every action ends with a public proof.
                </p>
              </div>
              <div className="hero-dashboard-app-header-actions">
                <span className="hero-dashboard-app-btn-outline">Outcome Ledger</span>
                <span className="hero-dashboard-app-btn-outline">Agent Studio</span>
                <span className="hero-dashboard-app-btn-primary">Latest proof</span>
              </div>
            </div>

            <div className="hero-dashboard-app-kpis">
              {[
                { label: 'USDC Budget', value: `${(budget / 100).toFixed(2)} USDC` },
                { label: 'Success Rate', value: `${passRate}%` },
                { label: 'USDC Spent', value: `${(spent / 100).toFixed(2)} USDC`, positive: true },
                { label: 'Active Agents', value: String(agents) },
              ].map((kpi) => (
                <div key={kpi.label} className="hero-dashboard-app-kpi">
                  <span className="hero-dashboard-app-kpi-label">{kpi.label}</span>
                  <span
                    className={`hero-dashboard-app-kpi-value ${kpi.positive ? 'hero-dashboard-app-kpi-value-positive' : ''}`}
                  >
                    {kpi.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="hero-dashboard-app-banner">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="hero-dashboard-app-banner-title">Setup complete</p>
                <p className="hero-dashboard-app-banner-desc">Your governed agent stack is ready.</p>
              </div>
            </div>

            <div className="hero-dashboard-app-grid">
              <div className="hero-dashboard-app-panel">
                <div className="hero-dashboard-app-panel-head">
                  <div>
                    <h4>Your Agents</h4>
                    <p>8 agents under governed finance control</p>
                  </div>
                  <span className="hero-dashboard-app-btn-primary hero-dashboard-app-btn-sm">+ Studio</span>
                </div>
                <ul className="hero-dashboard-app-agent-list">
                  {AGENTS.map((agent) => (
                    <li key={agent.name} className="hero-dashboard-app-agent-row">
                      <span className="hero-dashboard-app-agent-name">{agent.name}</span>
                      <span
                        className={`hero-dashboard-app-agent-badge hero-dashboard-app-agent-badge-${agent.tone}`}
                      >
                        {agent.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hero-dashboard-app-panel hero-dashboard-app-panel-command">
                <div className="hero-dashboard-app-panel-head">
                  <div>
                    <p className="hero-dashboard-app-command-label">
                      <Sparkles className="h-3.5 w-3.5" />
                      VALEN Command Agent
                    </p>
                    <p className="hero-dashboard-app-command-desc">
                      Conversational governed operations — plan, preview, execute, and prove.
                    </p>
                  </div>
                </div>
                <div className="hero-dashboard-app-chat">
                  <p>
                    I am VALEN Command Agent. Tell me what to pay, transfer, prove, or configure — I will plan the
                    governed action, run policy gates, and route you to settlement and proof.
                  </p>
                </div>
                <div className="hero-dashboard-app-input-row">
                  <span className="hero-dashboard-app-input">Pay 1 USDC, transfer TSLA…</span>
                  <span className="hero-dashboard-app-btn-outline hero-dashboard-app-btn-sm">Plan</span>
                  <span className="hero-dashboard-app-btn-primary hero-dashboard-app-btn-sm">Execute →</span>
                </div>
                <div className="hero-dashboard-app-chips">
                  {CHIPS.map((chip) => (
                    <span key={chip} className="hero-dashboard-app-chip">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
