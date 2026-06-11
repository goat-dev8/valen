'use client';

import { Check, Shield, X } from 'lucide-react';
import { GridWallpaper } from '@/components/marketing/grid-wallpaper';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const STATS = [
  { value: '4', label: 'Stylus evaluation engines' },
  { value: 'Fail-closed', label: 'Blocked intents never settle' },
  { value: 'On-chain', label: 'Immutable audit evidence' },
];

const ENGINES = [
  {
    name: 'Compliance',
    detail: 'Mandate validity, principal KYC, jurisdiction',
    runtime: 'Stylus',
  },
  {
    name: 'Risk',
    detail: 'Deterministic scoring, tiered approvals',
    runtime: 'Stylus',
  },
  {
    name: 'Eligibility',
    detail: 'Agent identity and scoped permissions',
    runtime: 'Stylus',
  },
  {
    name: 'Policy',
    detail: 'Spending caps, velocity, rule chains',
    runtime: 'Stylus',
  },
];

const EVALUATIONS = [
  {
    id: '8f2a…c41',
    intent: 'Buy 500 USDG · TokenX',
    agent: 'Agent-42',
    verdict: 'approved' as const,
    settlement: 'Arbitrum Sepolia',
    steps: [
      { label: 'Compliance', result: 'PASS', note: 'mandate valid · US jurisdiction' },
      { label: 'Risk', result: 'PASS', note: 'score 18 · LOW' },
      { label: 'Policy', result: 'PASS', note: 'within 1,000 USDG cap' },
      { label: 'Settlement', result: 'APPROVED', note: 'transfer executed' },
    ],
  },
  {
    id: '9b1c…7e2',
    intent: 'Buy 2,000 USDG · TokenX',
    agent: 'Agent-42',
    verdict: 'blocked' as const,
    settlement: 'Settlement Gate',
    steps: [
      { label: 'Compliance', result: 'PASS', note: 'mandate valid · US jurisdiction' },
      { label: 'Risk', result: 'PASS', note: 'score 24 · LOW' },
      { label: 'Policy', result: 'FAIL', note: 'exceeds 1,000 USDG cap' },
      { label: 'Settlement', result: 'BLOCKED', note: 'POLICY_CAP_EXCEEDED' },
    ],
  },
];

export function PermissionLayerSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="permission-layer" className="landing-section permission-layer-section grid-wallpaper-section">
      <GridWallpaper />
      <div className="landing-container">
        <div ref={ref} className={cn('permission-layer-content', visible && 'scroll-revealed')}>
          <div className="section-top-block">
            <SectionBadge suffix="Permission Layer" label="Core infrastructure" />
            <h2 className="landing-heading">Nothing settles without passing the gate.</h2>
            <p className="permission-layer-desc">
              VALEN sits between autonomous agents and onchain execution — every intent is
              evaluated by Stylus engines before the settlement gate approves or blocks.
            </p>
          </div>

          <div className="permission-layer-stats">
            {STATS.map((s, i) => (
              <div key={s.label} className="permission-layer-stat">
                <div className="permission-layer-stat-value">{s.value}</div>
                <div className="permission-layer-stat-label">{s.label}</div>
                {i < STATS.length - 1 && <div className="permission-layer-stat-divider" />}
              </div>
            ))}
          </div>

          <div className="permission-layer-grid">
            <div className="permission-layer-engines">
              {ENGINES.map((engine, i) => (
                <div
                  key={engine.name}
                  className="permission-engine-card"
                  style={{ transitionDelay: visible ? `${0.06 * i}s` : '0s' }}
                >
                  <div className="permission-engine-card-top">
                    <span className="permission-engine-icon">
                      <Shield className="h-4 w-4" />
                    </span>
                    <span className="permission-engine-runtime">{engine.runtime}</span>
                  </div>
                  <div className="permission-engine-name">{engine.name}</div>
                  <p className="permission-engine-detail">{engine.detail}</p>
                </div>
              ))}
              <div
                className="permission-engine-card permission-engine-card-gate"
                style={{ transitionDelay: visible ? '0.24s' : '0s' }}
              >
                <div className="permission-engine-card-top">
                  <span className="permission-engine-icon permission-engine-icon-gate">
                    <Shield className="h-4 w-4" />
                  </span>
                  <span className="permission-engine-runtime">Solidity</span>
                </div>
                <div className="permission-engine-name">Settlement Gate</div>
                <p className="permission-engine-detail">Final authority — token hooks, mandate registry, ERC integrations</p>
              </div>
            </div>

            <div className="permission-eval-mock">
              <div className="permission-eval-window">
                <div className="permission-eval-window-bar">
                  <div className="flex gap-1.5">
                    <span className="window-dot window-dot-red" />
                    <span className="window-dot window-dot-yellow" />
                    <span className="window-dot window-dot-green" />
                  </div>
                  <span className="text-xs text-[#31485f]">Intent Evaluation</span>
                </div>
                <div className="permission-eval-body">
                  {EVALUATIONS.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className={cn(
                        'permission-eval-card',
                        evaluation.verdict === 'approved'
                          ? 'permission-eval-card-approved'
                          : 'permission-eval-card-blocked',
                      )}
                    >
                      <div className="permission-eval-card-header">
                        <div>
                          <div className="permission-eval-intent">{evaluation.intent}</div>
                          <div className="permission-eval-meta">
                            {evaluation.agent} · #{evaluation.id}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'permission-eval-verdict',
                            evaluation.verdict === 'approved'
                              ? 'permission-eval-verdict-approved'
                              : 'permission-eval-verdict-blocked',
                          )}
                        >
                          {evaluation.verdict === 'approved' ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          {evaluation.verdict}
                        </span>
                      </div>
                      <div className="permission-eval-steps">
                        {evaluation.steps.map((step) => (
                          <div key={step.label} className="permission-eval-step">
                            <span className="permission-eval-step-label">{step.label}</span>
                            <span
                              className={cn(
                                'permission-eval-step-result',
                                step.result === 'FAIL' || step.result === 'BLOCKED'
                                  ? 'permission-eval-step-fail'
                                  : 'permission-eval-step-pass',
                              )}
                            >
                              {step.result}
                            </span>
                            <span className="permission-eval-step-note">{step.note}</span>
                          </div>
                        ))}
                      </div>
                      <div className="permission-eval-footer">
                        Routed via <strong>{evaluation.settlement}</strong>
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
