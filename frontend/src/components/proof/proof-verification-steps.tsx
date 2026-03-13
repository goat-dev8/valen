import { CheckCircle } from 'lucide-react';

const STEPS = [
  {
    title: 'Confirm outcome type',
    description: 'Check whether the proof shows Settled, Refused, or Payment — each maps to a public URL schema (proofVersion 1.0).',
  },
  {
    title: 'Verify on-chain evidence',
    description: 'Open the settlement transaction on the chain explorer and confirm the tx hash matches the proof record.',
  },
  {
    title: 'Validate mandate & identity',
    description: 'Compare mandate hash and ERC-8004 agent identity on the proof page with your organization records.',
  },
];

export function ProofVerificationSteps({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) {
  return (
    <section
      className={
        variant === 'sidebar'
          ? 'proof-verify-panel proof-verify-panel--sidebar'
          : 'proof-verify-panel'
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">How to verify this proof</p>
      <ol className="mt-4 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f4ff] text-xs font-bold text-[#007dfc]">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#012b54]">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-[#64748b]">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-xs text-emerald-700">
        <CheckCircle className="h-4 w-4" />
        Refusals are intentional safety outcomes — they prove VALEN blocked an unauthorized action.
      </p>
    </section>
  );
}
