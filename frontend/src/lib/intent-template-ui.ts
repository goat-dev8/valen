import type { IntentTemplate } from '@/lib/intent-templates';

export type IntentTemplateFilter = 'all' | 'arbitrum' | 'robinhood' | 'refused';

export type IntentTemplateGroup = {
  id: string;
  label: string;
  templates: IntentTemplate[];
};

export function intentTemplateSymbol(template: IntentTemplate): string {
  const robinhood = template.metadata?.robinhood as { ticker?: string } | undefined;
  if (robinhood?.ticker) return robinhood.ticker;
  if (template.id.includes('usdc')) return 'USDC';
  return 'ETH';
}

export function intentTemplateScenario(template: IntentTemplate): 'allowed' | 'refused' | 'neutral' {
  if (template.id.endsWith('-refused')) return 'refused';
  if (template.id.endsWith('-allowed') || template.id.startsWith('arbitrum-')) return 'allowed';
  return 'neutral';
}

export function filterIntentTemplates(templates: IntentTemplate[], filter: IntentTemplateFilter): IntentTemplate[] {
  if (filter === 'all') return templates;
  if (filter === 'arbitrum') return templates.filter((t) => t.targetChainId === 421614);
  if (filter === 'robinhood') return templates.filter((t) => t.targetChainId === 46630 && !t.id.endsWith('-refused'));
  return templates.filter((t) => t.id.endsWith('-refused'));
}

export function groupIntentTemplates(templates: IntentTemplate[]): IntentTemplateGroup[] {
  const arbitrum = templates.filter((t) => t.targetChainId === 421614);
  const robinhoodAllowed = templates.filter((t) => t.targetChainId === 46630 && !t.id.endsWith('-refused'));
  const robinhoodRefused = templates.filter((t) => t.targetChainId === 46630 && t.id.endsWith('-refused'));

  const groups: IntentTemplateGroup[] = [];
  if (arbitrum.length) groups.push({ id: 'arbitrum', label: 'Arbitrum Sepolia', templates: arbitrum });
  if (robinhoodAllowed.length) groups.push({ id: 'robinhood-allowed', label: 'Robinhood — allowed', templates: robinhoodAllowed });
  if (robinhoodRefused.length) groups.push({ id: 'robinhood-refused', label: 'Robinhood — refusal demos', templates: robinhoodRefused });
  return groups;
}
