import type { TimelineEventDto } from '@/types/api';

const PIPELINE_LABELS = [
  'intent.received',
  'mandate.verified',
  'compliance',
  'eligibility',
  'risk',
  'policy',
  'approval',
  'settlement',
  'proof',
];

function labelFor(eventName: string) {
  if (eventName.includes('created')) return 'Intent received';
  if (eventName.includes('mandate')) return 'Mandate verified';
  if (eventName.includes('compliance')) return 'Compliance';
  if (eventName.includes('eligibility')) return 'Eligibility';
  if (eventName.includes('risk')) return 'Risk';
  if (eventName.includes('policy')) return 'Policy';
  if (eventName.includes('approved') || eventName.includes('rejected')) return 'Approval';
  if (eventName.includes('settlement')) return 'Settlement';
  if (eventName.includes('attested') || eventName.includes('executed')) return 'Proof';
  return eventName;
}

export function PipelineTimeline({
  events,
  status,
}: {
  events?: TimelineEventDto[];
  status?: string;
}) {
  const terminal = status && ['executed', 'failed', 'cancelled', 'compliance_failed', 'risk_failed', 'policy_rejected'].includes(status);

  if (!events?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cbd5e1] p-5 text-sm text-[#64748b]">
        Waiting for the first pipeline event.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((step, i) => (
        <div key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ff] text-xs font-semibold text-[#007dfc]">
              {i + 1}
            </div>
            {i < events.length - 1 && <div className="min-h-[24px] w-px flex-1 bg-[#eef0f3]" />}
          </div>
          <div className="pb-6">
            <p className="font-medium text-[#012b54]">{labelFor(step.eventName)}</p>
            <p className="text-xs text-[#64748b]">{step.eventName}</p>
            <p className="font-mono text-xs text-[#64748b]">{step.eventHash}</p>
            <p className="text-sm text-[#64748b]">{new Date(step.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
      {!terminal && (
        <div className="rounded-2xl bg-[#f8fafc] p-4 text-sm text-[#64748b]">
          Polling continues until the execution reaches a terminal status.
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {PIPELINE_LABELS.map((label) => (
          <span key={label} className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs text-[#64748b]">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
