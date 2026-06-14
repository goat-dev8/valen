import type { ParsedCommand } from '@/lib/command-parser';

export function buildCommandResponse(parsed: ParsedCommand): string {
  switch (parsed.kind) {
    case 'execution':
      return `I'll prepare a governed ${parsed.label}. Policy, budget, and mandate gates will run before any settlement is attempted. Review the action preview below, then execute when ready.`;
    case 'x402':
      return `Understood — I'll open the x402 USDC payment flow${parsed.amount ? ` for ${parsed.amount} USDC` : ''}. Budget and mandate checks run at initiation, then EIP-3009 settlement produces a public proof.`;
    case 'budget':
      return `I'll take you to your USDC budget controls${parsed.amount ? ` with a target of ${parsed.amount} USDC` : ''} so you can review caps, spend, and remaining allowance.`;
    case 'proof':
      return 'Opening your Outcome Ledger — every settled and refused action publishes a verifiable public proof.';
    case 'agent':
      return 'Launching Agent Studio to create a governed agent with policy, authority, budget, and ERC-8004 identity.';
    case 'identity':
      return 'Navigating to your agent fleet to register or review ERC-8004 on-chain identity.';
    default:
      return `I parsed "${parsed.label}" as a custom governed intent. I'll route you to Governed Intent where policy evaluation runs before settlement.`;
  }
}

export function buildCommandResult(parsed: ParsedCommand, href: string): string {
  if (parsed.kind === 'x402') {
    return `x402 payment flow ready${parsed.amount ? ` · ${parsed.amount} USDC` : ''}. Complete settlement to publish proof.`;
  }
  if (parsed.kind === 'proof') {
    return 'Outcome Ledger opened. Latest proofs and refusal records are available for audit.';
  }
  return `Governed action queued · ${parsed.label}. Follow the flow to settlement and public proof.`;
}
