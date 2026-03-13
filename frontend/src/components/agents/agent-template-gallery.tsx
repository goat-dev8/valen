'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, Layers, Loader2, Play, Sparkles } from 'lucide-react';
import { AgentDitherPortrait } from '@/components/agents/agent-dither-portrait';
import {
  AGENT_TEMPLATES,
  agentMatchesTemplate,
  buildAgentTemplateClipboardPayload,
  type AgentTemplate,
} from '@/lib/agent-templates';
import { getAgentTypeTag, getAgentVisualIdentity } from '@/lib/agent-visual-identity';
import { formatCloneError, useCloneAgentTemplate } from '@/hooks/use-clone-agent-template';
import type { AgentDto } from '@/types/api';

const TAG_TONE_CLASS: Record<string, string> = {
  emerald: 'agent-fleet-tag--emerald',
  blue: 'agent-fleet-tag--blue',
  amber: 'agent-fleet-tag--amber',
  violet: 'agent-fleet-tag--violet',
};

function templateIdentity(template: AgentTemplate) {
  const identity = getAgentVisualIdentity(template.id, template.name);
  return { ...identity, pattern: template.visualPattern };
}

export function AgentTemplateGallery({ existingAgents = [] }: { existingAgents?: AgentDto[] }) {
  const cloneMutation = useCloneAgentTemplate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (template: AgentTemplate) => {
    try {
      await navigator.clipboard.writeText(buildAgentTemplateClipboardPayload(template));
      setCopiedId(template.id);
      window.setTimeout(() => setCopiedId((current) => (current === template.id ? null : current)), 2000);
    } catch {
      setError('Could not copy setup to clipboard');
    }
  };

  const handleClone = async (templateId: string) => {
    setError(null);
    try {
      await cloneMutation.mutateAsync(templateId);
    } catch (err) {
      setError(formatCloneError(err));
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="app-section-title flex items-center gap-2.5 text-xl text-[#012b54] md:text-2xl">
            <Sparkles className="h-5 w-5 shrink-0 text-[#0066FF]" aria-hidden />
            Discover Agents
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm font-medium text-[#8B98A5]">
            Clone a governed agent with policy, capabilities, and activation pre-configured. Finish wallet
            verification and mandate signing in Agent Studio.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="agent-fleet-grid">
        {AGENT_TEMPLATES.map((template) => {
          const identity = templateIdentity(template);
          const typeTag = getAgentTypeTag(template.agentType);
          const alreadyCloned = existingAgents.some((agent) => agentMatchesTemplate(agent.name, template));
          const cloning = cloneMutation.isPending && cloneMutation.variables === template.id;

          return (
            <article key={template.id} className="agent-fleet-card agent-template-card">
              <div className="agent-fleet-card__visual">
                <AgentDitherPortrait identity={identity} agentType={template.agentType} />

                <div className="agent-fleet-card__tags">
                  <span className="agent-fleet-tag agent-fleet-tag--blue">Template</span>
                  <span className={`agent-fleet-tag ${TAG_TONE_CLASS[typeTag.tone]}`}>
                    {typeTag.label}
                  </span>
                </div>

                {alreadyCloned ? (
                  <span className="agent-fleet-live agent-fleet-live--idle">IN FLEET</span>
                ) : (
                  <span className="agent-fleet-live agent-fleet-live--paused">READY</span>
                )}
              </div>

              <div className="agent-fleet-card__body">
                <h3 className="agent-fleet-card__title">{template.name}</h3>
                <p className="agent-fleet-card__subtitle">
                  <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {template.tagline}
                </p>
                <p className="agent-fleet-card__desc">{template.description}</p>

                <ul className="agent-template-highlights">
                  {template.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="agent-template-actions">
                  <button
                    type="button"
                    className="app-btn app-btn-primary flex-1 text-xs"
                    disabled={cloneMutation.isPending}
                    onClick={() => handleClone(template.id)}
                  >
                    {cloning ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Cloning…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Clone agent
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="app-btn app-btn-outline text-xs"
                    onClick={() => handleCopy(template)}
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy setup
                      </>
                    )}
                  </button>
                </div>

                {template.demoIntentTemplateId && (
                  <Link
                    href={`/dashboard/executions/new?template=${template.demoIntentTemplateId}`}
                    className="agent-template-demo-link"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    Preview demo intent
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
