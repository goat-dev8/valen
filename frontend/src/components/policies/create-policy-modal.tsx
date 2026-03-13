'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useOrganization } from '@/contexts/org-context';
import {
  useActivatePolicyVersion,
  useCreatePolicy,
  useCreatePolicyVersion,
  usePublishPolicyVersion,
  useUpdateAgent,
} from '@/hooks/use-valen-api';
import { POLICY_TEMPLATES, policyTemplateById } from '@/lib/policy-templates';
import { PolicyTemplatePreview } from '@/components/policies/policy-template-preview';
import { formatApiErrorMessage } from '@/lib/utils';

export type CreatePolicyModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (policyId: string) => void;
  /** When set, assigns the new policy to this agent after successful activation */
  assignAgentId?: string;
};

export function CreatePolicyModal({ open, onClose, onCreated, assignAgentId }: CreatePolicyModalProps) {
  const queryClient = useQueryClient();
  const { orgId } = useOrganization();
  const createMutation = useCreatePolicy();
  const createVersionMutation = useCreatePolicyVersion();
  const publishVersionMutation = usePublishPolicyVersion();
  const activateVersionMutation = useActivatePolicyVersion();
  const updateAgentMutation = useUpdateAgent();

  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState(POLICY_TEMPLATES[0].id);
  const selectedTemplate = policyTemplateById(templateId);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTemplateId(POLICY_TEMPLATES[0].id);
  }, [open]);

  if (!open) return null;

  const isPending =
    createMutation.isPending ||
    createVersionMutation.isPending ||
    publishVersionMutation.isPending ||
    activateVersionMutation.isPending ||
    updateAgentMutation.isPending;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const activateNow = form.get('activateNow') === 'on';
    const activationProof = String(form.get('activationProof') || '') || undefined;

    try {
      const policy = await createMutation.mutateAsync({
        name: String(form.get('name')),
        description: String(form.get('description') || '') || undefined,
      });
      const version = await createVersionMutation.mutateAsync({
        policyId: policy.id,
        rules: selectedTemplate.rules,
      });

      if (activateNow) {
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

        if (assignAgentId) {
          await updateAgentMutation.mutateAsync({
            agentId: assignAgentId,
            body: { defaultPolicyId: policy.id },
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['policies', orgId] });
      await queryClient.refetchQueries({ queryKey: ['policies', orgId] });

      onCreated(policy.id);
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to create policy'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#012b54]/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-policy-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E8ECF0] bg-white shadow-[0_24px_64px_-12px_rgba(0,102,255,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8ECF0] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066FF]">New policy</p>
            <h2 id="create-policy-modal-title" className="app-section-title mt-1 text-xl text-[#012b54]">
              Create Policy
            </h2>
            <p className="mt-1 text-sm text-[#8B98A5]">
              Start from a permission template, then publish and activate through the same APIs as the policy page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8B98A5] transition hover:bg-[#F4F6F8]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="app-form-group">
            <label htmlFor="create-policy-template">Template</label>
            <select
              id="create-policy-template"
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
            <label htmlFor="create-policy-name">Policy name</label>
            <input
              key={`${templateId}-name`}
              id="create-policy-name"
              name="name"
              className="app-input"
              defaultValue={selectedTemplate.name}
              required
            />
          </div>

          <div className="app-form-group">
            <label htmlFor="create-policy-description">Description</label>
            <textarea
              id="create-policy-description"
              key={`${templateId}-description`}
              name="description"
              className="app-input min-h-[88px]"
              defaultValue={selectedTemplate.description}
            />
          </div>

          <div className="app-form-group">
            <label htmlFor="create-policy-activation-proof">Activation proof ref</label>
            <input
              id="create-policy-activation-proof"
              name="activationProof"
              className="app-input"
              placeholder="wallet-signature-ref or approval ticket"
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-[#E8ECF0] bg-[#FAFBFC] p-4 text-sm text-[#5E6C7B]">
            <input type="checkbox" name="activateNow" defaultChecked className="mt-1" />
            <span>
              Create, submit, publish, and activate the first version now. Required for the policy to appear in the
              agent dropdown.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-[#E8ECF0] pt-4 sm:flex-row sm:justify-end">
            <button type="button" className="app-btn app-btn-outline" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="app-btn app-btn-primary" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create & activate policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
