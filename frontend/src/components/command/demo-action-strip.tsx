'use client';

import Link from 'next/link';
import { INTENT_TEMPLATES } from '@/lib/intent-templates';

const DEMO_ACTIONS = [
  {
    id: 'usdc',
    label: 'Allowed USDC',
    tone: 'success' as const,
    templateId: 'arbitrum-usdc',
    description: '0.001 USDC on Arbitrum Sepolia',
  },
  {
    id: 'tsla-refused',
    label: 'Refused TSLA',
    tone: 'danger' as const,
    templateId: 'robinhood-tsla-refused',
    description: 'Over-limit tokenized stock refusal',
  },
  {
    id: 'x402',
    label: 'x402 Payment',
    tone: 'primary' as const,
    href: '/dashboard/payments',
    description: 'Governed USDC HTTP payment',
  },
];

const TONE_CLASS = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  danger: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
  primary: 'border-[#dbeafe] bg-[#eff6ff] text-[#0f5db8] hover:bg-[#dbeafe]',
};

function templateHref(templateId: string): string {
  const template = INTENT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return '/dashboard/executions/new';
  const params = new URLSearchParams({
    template: templateId,
    chainId: String(template.targetChainId),
    actionType: template.actionType,
    amount: template.amount,
  });
  if (template.assetAddress) params.set('assetAddress', template.assetAddress);
  if (template.targetAddress) params.set('targetAddress', template.targetAddress);
  return `/dashboard/executions/new?${params.toString()}`;
}

export function DemoActionStrip() {
  return (
    <section className="rounded-2xl border border-[#eef0f3] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Quick actions</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_ACTIONS.map((action) => (
          <Link
            key={action.id}
            href={action.href ?? templateHref(action.templateId!)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${TONE_CLASS[action.tone]}`}
            title={action.description}
          >
            {action.label}
          </Link>
        ))}
        <Link
          href="/proofs/pack"
          className="rounded-full border border-[#eef0f3] bg-white px-4 py-2 text-sm font-semibold text-[#31485f] transition hover:border-[#007dfc] hover:text-[#007dfc]"
        >
          Proof Pack
        </Link>
      </div>
    </section>
  );
}
