'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { useActivatePolicyVersion, useCreatePolicy, useCreatePolicyVersion, usePublishPolicyVersion, useAgents, useUpdateAgent } from '@/hooks/use-valen-api';
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

  return (
    <div className="space-y-6">
      <Link href="/dashboard/policies" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Policies
      </Link>

      <PageHeader title="Create Policy" description="Start from a permission template, then publish and activate a version through existing policy APIs." />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="app-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="app-form-group">
              <label htmlFor="templateId">Template</label>
              <select id="templateId" className="app-input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {POLICY_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="app-form-group">
              <label htmlFor="name">Policy Name</label>
              <input key={`${templateId}-name`} id="name" name="name" className="app-input" defaultValue={selectedTemplate.name} required />
            </div>
            <div className="app-form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                key={`${templateId}-description`}
                name="description"
                className="app-input min-h-[100px]"
                defaultValue={selectedTemplate.description}
              />
            </div>
            <div className="app-form-group">
              <label htmlFor="activationProof">Activation Proof Ref</label>
              <input
                id="activationProof"
                name="activationProof"
                className="app-input"
                placeholder="wallet-signature-ref or approval ticket"
              />
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-[#eef0f3] p-4 text-sm text-[#64748b]">
              <input type="checkbox" name="activateNow" defaultChecked className="mt-1" />
              <span>
                Create, submit, publish, and activate the first version now using existing policy lifecycle endpoints.
                If your role cannot publish or activate, the policy and draft version will still show the backend error.
              </span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="app-btn app-btn-primary"
              disabled={
                createMutation.isPending ||
                createVersionMutation.isPending ||
                publishVersionMutation.isPending ||
                activateVersionMutation.isPending ||
                updateAgentMutation.isPending
              }
            >
              {createMutation.isPending ||
              createVersionMutation.isPending ||
              publishVersionMutation.isPending ||
              activateVersionMutation.isPending
                ? 'Creating...'
                : 'Create Policy'}
            </button>
          </form>
        </div>

        <div className="app-card">
          <h3 className="app-card-title">Permission Rules Preview</h3>
          <p className="mt-2 text-sm text-[#64748b]">{selectedTemplate.description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries((selectedTemplate.rules.permissions as Record<string, unknown>) ?? {}).map(([key, value]) => (
              <div key={key} className="rounded-2xl bg-[#f8fafc] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#64748b]">{key}</p>
                <p className="mt-2 break-words text-sm font-medium text-[#012b54]">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
          <pre className="mt-5 max-h-[360px] overflow-auto rounded-2xl bg-[#011b33] p-4 text-xs leading-5 text-white">
            {JSON.stringify(selectedTemplate.rules, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
