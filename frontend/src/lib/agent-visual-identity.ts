import type { AgentTypeValue } from '@/lib/agent-types';

export type AgentVisualPattern = 'mesh' | 'orbit' | 'grid' | 'wave';

export type AgentVisualIdentity = {
  seed: number;
  palette: {
    base: string;
    accent: string;
    accent2: string;
    glow: string;
  };
  pattern: AgentVisualPattern;
  glyph: string;
};

const TYPE_ACCENT: Record<AgentTypeValue, { label: string; tone: string }> = {
  hosted: { label: 'Hosted', tone: 'emerald' },
  external: { label: 'API Agent', tone: 'blue' },
  service: { label: 'Service', tone: 'amber' },
  experimental: { label: 'Sandbox', tone: 'violet' },
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function hueFromSeed(seed: number, offset = 0): number {
  return (seed + offset * 47) % 360;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h} ${s}% ${l}%)`;
}

export function getAgentVisualIdentity(agentId: string, agentName: string): AgentVisualIdentity {
  const seed = hashString(`${agentId}:${agentName}`);
  const h1 = hueFromSeed(seed, 0);
  const h2 = hueFromSeed(seed, 3);
  const h3 = hueFromSeed(seed, 7);

  const parts = agentName.trim().split(/\s+/).filter(Boolean);
  const glyph =
    parts.length >= 2
      ? `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
      : (agentName.slice(0, 2) || 'AG').toUpperCase();

  return {
    seed,
    palette: {
      base: hsl(h1, 42, 8),
      accent: hsl(h2, 88, 58),
      accent2: hsl(h3, 76, 52),
      glow: hsl(h2, 90, 65),
    },
    pattern: pick<AgentVisualPattern>(['mesh', 'orbit', 'grid', 'wave'], seed, 1),
    glyph,
  };
}

export function getAgentTypeTag(agentType: string | undefined | null) {
  const key = (agentType ?? 'hosted') as AgentTypeValue;
  return TYPE_ACCENT[key] ?? TYPE_ACCENT.hosted;
}

export function getAgentCapabilityTags(agentType: string | undefined | null): string[] {
  switch (agentType) {
    case 'external':
      return ['Programmatic', 'API'];
    case 'service':
      return ['Headless', 'Cron'];
    case 'experimental':
      return ['Demo', 'QA'];
    default:
      return ['Dashboard', 'Governed'];
  }
}
