import type { AgentCapability } from '@/lib/agent-types';
import { readAgentScope } from '@/lib/agent-scope';
import type { ParsedCommand } from '@/lib/command-parser';
import type { AgentDto } from '@/types/api';

export function requiredCapabilities(parsed: ParsedCommand): AgentCapability[] {
  if (parsed.kind === 'x402' || parsed.templateId?.includes('usdc') || parsed.label.toLowerCase().includes('usdc')) {
    return ['x402_payment', 'token_transfer'];
  }
  if (
    parsed.templateId?.includes('robinhood') ||
    /tsla|amzn|pltr|nflx|amd|usdg/i.test(parsed.label)
  ) {
    return ['robinhood_trade', 'token_transfer'];
  }
  if (parsed.kind === 'execution') {
    return ['token_transfer'];
  }
  return [];
}

export function agentHasCapabilities(agent: AgentDto, required: AgentCapability[]): boolean {
  if (required.length === 0) return true;
  const scope = readAgentScope(agent.metadata);
  const caps = new Set(
    (Array.isArray(agent.metadata?.capabilities) ? (agent.metadata!.capabilities as string[]) : []).concat(
      scope.supportedActions.includes('x402_payment') ? ['x402_payment'] : [],
      scope.supportedActions.includes('transfer') ? ['token_transfer'] : [],
      scope.supportedAssets.some((a) => /TSLA|AMZN|NFLX|PLTR|AMD|USDG/i.test(a)) ? ['robinhood_trade'] : [],
    ),
  );
  return required.some((cap) => caps.has(cap));
}
