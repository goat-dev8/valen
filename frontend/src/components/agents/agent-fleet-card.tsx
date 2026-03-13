'use client';

import Link from 'next/link';
import { Clock, Lock, Shield, Users } from 'lucide-react';
import { AgentDitherPortrait } from '@/components/agents/agent-dither-portrait';
import {
  getAgentCapabilityTags,
  getAgentTypeTag,
  getAgentVisualIdentity,
} from '@/lib/agent-visual-identity';
import type { AgentDto } from '@/types/api';
import type { AgentTypeOption } from '@/lib/agent-types';

export type AgentFleetCardModel = {
  agent: AgentDto;
  readinessCount: number;
  typeMeta: AgentTypeOption;
  hasMandate: boolean;
  hasPolicy: boolean;
};

const TAG_TONE_CLASS: Record<string, string> = {
  emerald: 'agent-fleet-tag--emerald',
  blue: 'agent-fleet-tag--blue',
  amber: 'agent-fleet-tag--amber',
  violet: 'agent-fleet-tag--violet',
};

export function AgentFleetCard({ model }: { model: AgentFleetCardModel }) {
  const { agent, readinessCount, typeMeta, hasMandate, hasPolicy } = model;
  const identity = getAgentVisualIdentity(agent.id, agent.name);
  const typeTag = getAgentTypeTag(agent.agentType);
  const capabilityTags = getAgentCapabilityTags(agent.agentType).slice(0, 1);
  const isActive = agent.status === 'active';
  const isLive = isActive && hasMandate && hasPolicy;

  return (
    <Link href={`/dashboard/agents/${agent.id}`} className="agent-fleet-card group">
      <div className="agent-fleet-card__visual">
        <AgentDitherPortrait identity={identity} agentType={agent.agentType} />

        <div className="agent-fleet-card__tags">
          <span className={`agent-fleet-tag ${TAG_TONE_CLASS[typeTag.tone]}`}>{typeTag.label}</span>
          {capabilityTags.map((tag) => (
            <span key={tag} className="agent-fleet-tag agent-fleet-tag--muted">
              {tag}
            </span>
          ))}
          {hasPolicy && (
            <span className="agent-fleet-tag agent-fleet-tag--governance">
              <Shield className="h-3 w-3" aria-hidden />
              Governed
            </span>
          )}
        </div>

        {isLive ? (
          <span className="agent-fleet-live">
            <span className="agent-fleet-live__dot" aria-hidden />
            LIVE
          </span>
        ) : isActive ? (
          <span className="agent-fleet-live agent-fleet-live--idle">ACTIVE</span>
        ) : (
          <span className="agent-fleet-live agent-fleet-live--paused">{agent.status}</span>
        )}
      </div>

      <div className="agent-fleet-card__body">
        <h3 className="agent-fleet-card__title">{agent.name}</h3>
        <p className="agent-fleet-card__subtitle">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {hasMandate
            ? 'Mandate-bound · policy-gated execution'
            : hasPolicy
              ? 'Policy assigned · mandate pending'
              : 'Setup pending · assign policy & mandate'}
        </p>
        {agent.description ? (
          <p className="agent-fleet-card__desc">{agent.description}</p>
        ) : (
          <p className="agent-fleet-card__desc">{typeMeta.tagline}</p>
        )}

        <div className="agent-fleet-card__meta">
          <span className="agent-fleet-card__meta-item">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {readinessCount}/4 ready
          </span>
          <span className="agent-fleet-card__meta-item">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {new Date(agent.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
