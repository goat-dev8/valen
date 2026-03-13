'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { PolicyTemplatePreview } from '@/components/policies/policy-template-preview';
import {
  useActivatePolicyVersion,
  useAgents,
  useCreatePolicy,
  useCreatePolicyVersion,
  usePublishPolicyVersion,
  useUpdateAgent,
} from '@/hooks/use-valen-api';
import { POLICY_TEMPLATES, policyTemplateById } from '@/lib/policy-templates';

export default function CreatePolicyPage() {
  const router = useRouter();
  const createMutation = useCreatePolicy();
  const createVersionMutation = useCreatePolicyVersion();
  const publishVersionMutation = usePublishPolicyVersion();
  const activateVersionMutation = useActivatePolicyVersion();
  const { data: agents } = useAgents({ limit: 100, status: 'active' });
  const updateAgentMutation = useUpdateAgent();
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState(POLICY_TEMPLATES[0].id);
  const selectedTemplate = policyTemplateById(templateId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const activationProof = String(form.get('activationProof') || '') || undefined;
      const policy = await createMutation.mutateAsync({
        name: String(form.get('name')),
        description: String(form.get('description') || '') || undefined,
      });
      const version = await createVersionMutation.mutateAsync({
        policyId: policy.id,
        rules: selectedTemplate.rules,
      });

      if (form.get('activateNow') === 'on') {
        const published = await publishVersionMutation.mutateAsync({
          policyId: policy.id,
          versionId: version.id,
          approvalRef: activationProof,
        });
        await activateVersionMutation.mutateAsync({
          policyId: policy.id,
          versionId: published.id,
          approvalRef: activationProof,
        });

        const activeAgents = agents?.items.filter((agent) => !agent.defaultPolicyId) ?? [];
        await Promise.all(
          activeAgents.map((agent) =>
            updateAgentMutation.mutateAsync({
              agentId: agent.id,
              body: { defaultPolicyId: policy.id },
            }),
          ),
        );
      }

      router.push(`/dashboard/policies/${policy.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create policy');
    }
  };

  const isPending =
    createMutation.isPending ||
    createVersionMutation.isPending ||
    publishVersionMutation.isPending ||
    activateVersionMutation.isPending ||
    updateAgentMutation.isPending;

  return (
    <div className="policy-create-page space-y-6">
      <Link href="/dashboard/policies" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Policies
      </Link>

      <PageHeader
        title="Create Policy"
        description="Pick a template, name your policy, and publish the first version."
        className="intent-wizard-header"
      />

      <div className="app-panel-floating policy-create-form">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="app-form-group">
            <label htmlFor="templateId">Template</label>
            <select
              id="templateId"
              className="app-input"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {POLICY_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <PolicyTemplatePreview template={selectedTemplate} />
          </div>

          <div className="app-form-group">
            <label htmlFor="name">Policy name</label>
            <input
              key={`${templateId}-name`}
              id="name"
              name="name"
              className="app-input"
              defaultValue={selectedTemplate.name}
              required
            />
          </div>

          <div className="app-form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              key={`${templateId}-description`}
              name="description"
              className="app-input min-h-[88px]"
              defaultValue={selectedTemplate.description}
            />
          </div>

          <div className="app-form-group">
            <label htmlFor="activationProof">Activation proof ref</label>
            <input
              id="activationProof"
              name="activationProof"
              className="app-input"
              placeholder="wallet-signature-ref or approval ticket"
            />
          </div>

          <label className="policy-create-form__checkbox">
            <input type="checkbox" name="activateNow" defaultChecked className="mt-1" />
            <span>
              Publish and activate the first version now so the policy is ready to assign to agents.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="app-btn app-btn-primary" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create Policy'}
          </button>
        </form>
      </div>
    </div>
  );
}
