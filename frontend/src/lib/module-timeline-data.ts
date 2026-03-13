import type { LucideIcon } from 'lucide-react';
import { LANDING_MODULES } from '@/lib/landing-content';

export type ModuleTimelineItem = {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: LucideIcon;
  relatedIds: number[];
  status: 'completed' | 'in-progress' | 'pending';
  energy: number;
  route: string;
  accent: string;
};

/** Pipeline adjacency for the orbital module graph */
const RELATED: Record<string, number[]> = {
  mandates: [2, 4],
  policy: [1, 3, 4],
  budget: [2, 5],
  engines: [1, 2, 5],
  settlement: [3, 4, 6],
  proofs: [5, 7, 8],
  x402: [3, 6],
  identity: [1, 6],
};

const STATUS: Record<string, ModuleTimelineItem['status']> = {
  mandates: 'completed',
  policy: 'completed',
  budget: 'in-progress',
  engines: 'in-progress',
  settlement: 'in-progress',
  proofs: 'completed',
  x402: 'completed',
  identity: 'pending',
};

const ENERGY: Record<string, number> = {
  mandates: 100,
  policy: 95,
  budget: 88,
  engines: 92,
  settlement: 90,
  proofs: 98,
  x402: 85,
  identity: 75,
};

export function buildModuleTimelineData(): ModuleTimelineItem[] {
  return LANDING_MODULES.map((mod, index) => ({
    id: index + 1,
    title: mod.title,
    date: mod.tag,
    content: mod.description,
    category: mod.tag,
    icon: mod.icon,
    relatedIds: RELATED[mod.id] ?? [],
    status: STATUS[mod.id] ?? 'pending',
    energy: ENERGY[mod.id] ?? 70,
    route: mod.route,
    accent: mod.accent,
  }));
}
