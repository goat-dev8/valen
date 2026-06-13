import { keccak256, stringToHex } from 'viem';

/** Shared testnet policy/mandate constants aligned with contracts/script/e2e-validation.ts */
export const POLICY_VERSION_HASH = keccak256(stringToHex('valen-policy-v1'));
export const ORGANIZATION_HASH = keccak256(stringToHex('valen-org-e2e'));
export const MANDATE_STATUS_HASH = keccak256(stringToHex('mandate-active'));
export const MANDATE_SCOPE_HASH = keccak256(stringToHex('scope-transfer'));
export const ACTION_TYPE_TRANSFER = keccak256(stringToHex('transfer'));
export const PRINCIPAL_HASH = keccak256(stringToHex('principal-e2e'));
export const COMPLIANCE_RULE_HASH = keccak256(stringToHex('valen-compliance-rule-v1'));
export const DEFAULT_E2E_ASSET = '0x0000000000000000000000000000000000000001' as const;
export const DEFAULT_SETTLEMENT_AMOUNT_WEI = 1_000_000_000_000_000n; // 0.001 ETH

/** Active mandate from contracts/script/e2e-validation.ts on Arbitrum Sepolia */
export const ARBITRUM_SEPOLIA_E2E_MANDATE_ID =
  '0xa812c48711980554f5c484fb0029dda208ddaa68af7f66030ae3d25a77dad918' as const;

/** Dynamically granted demo mandate with USDC scope binding (Arbitrum Sepolia) */
export const ARBITRUM_SEPOLIA_USDC_MANDATE_ID =
  '0x71f3641e5b6c22eccc2ada4891acd05165fa9e6b0ae4f8c203c3a21a04fe5c08' as const;

/** Active mandate from contracts/reports/e2e-robinhood-testnet.json on Robinhood Testnet */
export const ROBINHOOD_TESTNET_E2E_MANDATE_ID =
  '0x4e90e7fd37ede4ddd71004ce186a9efa1b068fb2126c6a506db8d5f02bb4cc5b' as const;

export const RISK_TIER_LABELS = ['low', 'medium', 'high', 'critical'] as const;

export function riskTierLabel(tier: number): (typeof RISK_TIER_LABELS)[number] {
  return RISK_TIER_LABELS[tier] ?? 'low';
}
