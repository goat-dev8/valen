'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, FlaskConical, Globe, Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import {
  AGENT_CAPABILITY_OPTIONS,
  AGENT_TYPE_OPTIONS,
  type AgentCapability,
  type AgentTypeValue,
  defaultCapabilitiesForType,
  setupStepsForType,
} from '@/lib/agent-types';
import { useCreateAgent, usePolicies } from '@/hooks/use-valen-api';
import { formatApiErrorMessage } from '@/lib/utils';

const TYPE_ICONS = {
  hosted: Bot,
  external: Globe,
  service: Server,
  experimental: FlaskConical,
} as const;

export default function RegisterAgentPage() {
  const router = useRouter();
  const createMutation = useCreateAgent();
  const { data: policies } = usePolicies();
  const [error, setError] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<AgentTypeValue>('hosted');
  const [capabilities, setCapabilities] = useState<AgentCapability[]>(() => defaultCapabilitiesForType('hosted'));

  const activePolicies = useMemo(
    () => (policies ?? []).filter((policy) => policy.status === 'active'),
    [policies],
  );

  const selectedType = AGENT_TYPE_OPTIONS.find((option) => option.value === agentType) ?? AGENT_TYPE_OPTIONS[0];
  const setupSteps = setupStepsForType(agentType);

  const handleTypeChange = (value: AgentTypeValue) => {
    setAgentType(value);
    setCapabilities(defaultCapabilitiesForType(value));
  };

  const toggleCapability = (value: AgentCapability) => {
    setCapabilities((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const defaultPolicyId = String(formData.get('defaultPolicyId') || '') || undefined;

    try {
      const agent = await createMutation.mutateAsync({
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        agentType,
        defaultPolicyId,
        capabilities,
      });

      router.push(`/dashboard/agents/${agent.id}?welcome=1`);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to register agent'));
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/agents" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      <PageHeader
        title="Register Agent"
        description="Define who can act on your organization's behalf, then complete wallet, policy, and mandate setup on the agent page."
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="app-card max-w-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="app-form-group">
              <label htmlFor="name">Agent Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                className="app-input"
                placeholder="e.g. Treasury Bot Alpha"
              />
              <p className="text-xs text-[#64748b]">2–120 characters. Used in proofs, mandates, and the public agent profile slug.</p>
            </div>

            <div className="app-form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="app-input min-h-[88px]"
                placeholder="What this agent does, which chains it uses, and who owns it..."
              />
              <p className="text-xs text-[#64748b]">Stored in agent metadata and ERC-8004 identity proofs.</p>
            </div>

            <div className="app-form-group">
              <span className="mb-2 block text-sm font-medium text-[#012b54]">Agent Type</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {AGENT_TYPE_OPTIONS.map((option) => {
                  const Icon = TYPE_ICONS[option.value];
                  const selected = agentType === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        selected
                          ? 'border-[#007dfc] bg-[#f8fbff] shadow-sm'
                          : 'border-[#eef0f3] hover:border-[#cfe6ff]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="agentType"
                        value={option.value}
                        checked={selected}
                        onChange={() => handleTypeChange(option.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div className={`rounded-xl p-2 ${selected ? 'bg-[#007dfc]/10 text-[#007dfc]' : 'bg-[#f8fafc] text-[#64748b]'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#012b54]">{option.label}</p>
                            {option.recommended && (
                              <span className="rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#3f6212]">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#007dfc]">{option.tagline}</p>
                          <p className="mt-2 text-xs leading-5 text-[#64748b]">{option.description}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="app-form-group">
              <span className="mb-2 block text-sm font-medium text-[#012b54]">Capabilities</span>
              <div className="space-y-2">
                {AGENT_CAPABILITY_OPTIONS.map((option) => {
                  const checked = capabilities.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                        checked ? 'border-[#007dfc]/40 bg-[#f8fbff]' : 'border-[#eef0f3]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCapability(option.value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium text-[#012b54]">{option.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#64748b]">{option.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="app-form-group">
              <label htmlFor="defaultPolicyId">Default Policy</label>
              <select id="defaultPolicyId" name="defaultPolicyId" className="app-input" defaultValue="">
                <option value="">Assign later on agent detail</option>
                {activePolicies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#64748b]">
                {activePolicies.length
                  ? 'Optional now — required before Submit Intent is unlocked.'
                  : 'No active policies yet. Create one from Policies, then assign it here or on the agent page.'}
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 border-t border-[#eef0f3] pt-4">
              <button type="submit" className="app-btn app-btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Registering...' : 'Register Agent'}
              </button>
              <p className="text-xs text-[#64748b]">
                Agent activates immediately. You will land on the readiness checklist next.
              </p>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="app-card">
            <h3 className="app-card-title">Selected type</h3>
            <p className="mt-2 text-sm font-semibold text-[#012b54]">{selectedType.label}</p>
            <p className="mt-1 text-sm text-[#64748b]">{selectedType.audience}</p>
            <div className="mt-4 rounded-2xl border border-[#eef0f3] bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">After registration</p>
              <ol className="mt-3 space-y-2">
                {setupSteps.map((step) => (
                  <li key={step} className="flex gap-2 text-sm leading-5 text-[#012b54]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007dfc]" />
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            {selectedType.requiresApiKey && (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                {selectedType.label} agents require a mandate-bound API key before programmatic access is ready.
              </p>
            )}
          </div>

          <div className="app-card">
            <h3 className="app-card-title">Need a policy first?</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              Policies define compliance rules, risk thresholds, and allowed actions. You can create one from a template and
              return here to assign it during registration.
            </p>
            <Link href="/dashboard/policies/new" className="app-btn app-btn-outline mt-4 inline-flex">
              Create policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
