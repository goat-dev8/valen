export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  traceId?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  requestId?: string;
  traceId?: string;
};

export type UserDto = {
  id: string;
  privyUserId: string;
  email: string | null;
  displayName: string | null;
  status: string;
};

export type OrganizationMembershipDto = {
  id: string;
  role: string;
  status: string;
};

export type MeResponseDto = {
  user: UserDto;
  organizations: OrganizationMembershipDto[];
  permissions: string[];
};

export type OrganizationDto = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  defaultChainId: number | null;
  riskMode: string;
  complianceMode: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentDto = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: string;
  agentType: string;
  defaultPolicyId: string | null;
  publicSlug?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentWalletDto = {
  id: string;
  chainId: number;
  walletAddress: string;
  walletType: string;
  isPrimary: boolean;
  status: string;
};

export type AgentIdentityDto = {
  agentId: string;
  erc8004: {
    status: string;
    registryAddress: string | null;
    resolverAddress: string | null;
    tokenId: string | null;
    chainId: number;
    ownerAddress: string | null;
    tokenUri: string | null;
    metadata: Record<string, unknown>;
    metadataHash: string | null;
    lastSyncedAt: string | null;
  };
  walletBindings: Array<{
    id: string;
    chainId: number;
    walletAddress: string;
    walletType: string;
    isPrimary: boolean;
    status: string;
  }>;
  verifiedWallets: Array<{
    id: string;
    chainId: number;
    walletAddress: string;
    status: string;
    verifiedAt: string | null;
  }>;
  mandates: Array<{
    id: string;
    chainId: number;
    signerAddress: string | null;
    status: string;
    allowedChains: number[];
    allowedActions: string[];
    allowedAssets: string[];
    allowedTargets: string[];
    typedDataHash: string | null;
    validUntil: string;
  }>;
};

export type WalletChallengeDto = {
  chainId: number;
  walletAddress: string;
};

export type WalletVerifyDto = WalletChallengeDto & {
  signature: string;
};

export type WalletChallengeResponseDto = {
  id: string;
  chainId: number;
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: string;
};

export type WalletVerificationDto = {
  id: string;
  chainId: number;
  walletAddress: string;
  status: string;
  signature: string | null;
  verifiedAt: string | null;
  challengeExpiresAt: string;
  createdAt: string;
};

export type MandateTypedDataRequestDto = {
  agentId: string;
  policyId?: string;
  signerAddress: string;
  chainId: number;
  allowedChains: number[];
  allowedActions: string[];
  allowedAssets: string[];
  allowedTargets: string[];
  maxPerTransaction?: string;
  maxTotal?: string;
  approvalThreshold?: string;
  validUntil: string;
  nonce?: string;
};

export type CreateSignedMandateDto = MandateTypedDataRequestDto & {
  signature: string;
  typedDataHash: string;
  signedTypedData?: Record<string, unknown>;
};

export type MandateTypedDataResponseDto = {
  typedData: Record<string, unknown>;
  typedDataHash: string;
  nonce: string;
};

export type MandateDto = {
  id: string;
  organizationId: string;
  agentId: string;
  policyId: string | null;
  chainId: number;
  signerAddress: string;
  status: string;
  allowedChains: number[];
  allowedActions: string[];
  allowedAssets: string[];
  allowedTargets: string[];
  maxPerTransaction: string | null;
  maxTotal: string | null;
  approvalThreshold: string | null;
  typedDataHash: string;
  signature: string;
  validUntil: string;
  createdAt: string;
};

export type ApiKeyDto = {
  id: string;
  name: string;
  keyPrefix: string;
  mandateId: string | null;
  scopes: string[];
  status: string;
  expiresAt: string | null;
  createdAt: string;
  oneTimeSecret?: string;
};

export type PolicyDto = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: string;
  activeVersionId: string | null;
  createdAt: string;
};

export type PolicyVersionDto = {
  id: string;
  policyId: string;
  versionNumber: number;
  status: string;
  rules: Record<string, unknown>;
  rulesHash: string;
  publishedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
};

export type PolicyDetailDto = PolicyDto & {
  versions: PolicyVersionDto[];
};

export type ExecutionDto = {
  id: string;
  organizationId: string;
  agentId: string;
  mandateId: string | null;
  policyId: string | null;
  idempotencyKey: string;
  actionType: string;
  status: string;
  targetChainId: number;
  targetAddress: string | null;
  assetAddress: string | null;
  valueAmount: string | null;
  requestPayloadHash: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummaryDto = {
  organization: {
    id: string;
    name: string;
    defaultChainId: number | null;
  };
  agent: {
    id: string;
    name: string | null;
    status: string | null;
    defaultPolicyId: string | null;
    walletAddress: string | null;
    walletChainId: number | null;
  } | null;
  readiness: {
    walletConnected: boolean;
    agentActive: boolean;
    rulesActive: boolean;
    walletVerified: boolean;
    mandateSigned: boolean;
    usdcBudgetFunded: boolean;
    firstExecutionComplete: boolean;
    proofAvailable: boolean;
    completed: number;
    total: number;
    percent: number;
  };
  budget: {
    assetSymbol: string;
    status: string;
    remaining?: string | null;
    cap?: string | null;
    spent?: string | null;
    evidenceHash?: string | null;
    resetsAt?: string | null;
    note?: string;
  };
  counts: {
    policies: number;
    activeMandates: number;
    totalExecutions: number;
    executedExecutions: number;
    pendingApprovals: number;
    failedOrRefusedExecutions: number;
  };
  latest: {
    execution: {
      id: string;
      status: string | null;
      actionType: string | null;
      chainId: number | null;
      asset: string | null;
      createdAt: string | null;
      href: string;
    } | null;
    proof: {
      executionId: string;
      actionType: string | null;
      chainId: number | null;
      asset: string | null;
      txHash: string | null;
      blockNumber: string | null;
      createdAt: string | null;
      href: string | null;
      dashboardHref?: string | null;
    } | null;
    refusal: {
      executionId: string;
      status: string | null;
      actionType: string | null;
      chainId: number | null;
      asset: string | null;
      createdAt: string | null;
      href: string;
      dashboardHref?: string;
    } | null;
    robinhood: {
      executionId: string;
      status: string | null;
      actionType: string | null;
      asset: string | null;
      txHash: string | null;
      createdAt: string | null;
      href: string | null;
      dashboardHref?: string | null;
    } | null;
    payment: {
      paymentId: string;
      status: string;
      amount: string | null;
      settlementTx: string | null;
      createdAt: string | null;
      href: string;
    } | null;
  };
};

export type X402PaymentResponseDto = {
  paymentId: string;
  agentId?: string;
  chainId?: number;
  merchantUrl?: string | null;
  recipient?: string;
  assetSymbol?: string;
  amount?: string;
  status: string;
  refusalReason?: string | null;
  evidenceHash?: string | null;
  settlementTx?: string | null;
  nonce?: string | null;
  proofUrl?: string;
  refusalProofUrl?: string | null;
  budget?: {
    cap?: string;
    spent?: string;
    remaining?: string;
    allow?: boolean;
  } | null;
};

export type BudgetDto = {
  id: string;
  organization_id?: string;
  agent_id?: string;
  chain_id?: number;
  asset_address?: string;
  asset_symbol?: string;
  cap?: string;
  spent?: string;
  remaining?: string;
  status?: string;
  evidence_hash?: string;
  resets_at?: string;
};

export type BudgetEventDto = {
  id: string;
  kind: string;
  amount: string;
  before_spent: string;
  after_spent: string;
  remaining: string;
  evidence_hash: string;
  execution_id?: string | null;
  created_at: string;
};

export type ComplianceCheckDto = {
  id: string;
  executionId: string;
  status: string;
  provider: string;
  reasonCode: string;
  subjectType: string;
  subjectRef: string;
  checkedAt: string | null;
};

export type ComplianceSubjectDto = {
  subjectRef: string;
  attestations: {
    id: string;
    provider: string;
    subjectType: string;
    subjectRef: string;
    attestationHash: string;
    status: string;
    expiresAt: string;
  }[];
  recentChecks: ComplianceCheckDto[];
};

export type RiskScoreDto = {
  id: string;
  executionId: string;
  score: number;
  tier: string;
  requiresApproval: boolean;
  calculatedAt: string;
};

export type SettlementDto = {
  id: string;
  executionId: string;
  chainId: number;
  contractAddress: string;
  status: string;
  txHash: string | null;
  submitTxHash: string | null;
  approveTxHash: string | null;
  blockNumber: string | null;
  onChainSettlementId: string | null;
  failureReason: string | null;
  relayerAddress: string | null;
  createdAt: string;
};

export type RobinhoodAssetScenarioDto = {
  id: string;
  kind: 'allowed' | 'refused';
  label: string;
  amount: string;
  supportLevel: string;
  settlementMode: string;
  note: string;
};

export type RobinhoodAssetDto = {
  id: string;
  chainId: number;
  symbol: string;
  name: string;
  address: string | null;
  decimals: number;
  category: string;
  supportLevel: string;
  settlementModes: string[];
  metadata: Record<string, unknown>;
  source: string;
  sourceUrl: string | null;
  verifiedAt: string | null;
  settlementRail: string;
  scenarios: RobinhoodAssetScenarioDto[];
};

export type AuditLogDto = {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  eventHash: string;
  createdAt: string;
};

export type TimelineEventDto = {
  id: string;
  eventName: string;
  eventHash: string;
  createdAt: string;
};

export type TeamMemberDto = {
  id: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  role: string;
  status: string;
  joinedAt: string | null;
  createdAt: string;
};

export type WebhookDto = {
  id: string;
  name: string;
  url: string;
  subscribedEvents: string[];
  status: string;
  createdAt: string;
};

export type CreateExecutionInput = {
  agentId: string;
  idempotencyKey: string;
  actionType: string;
  targetChainId: number;
  targetAddress: string;
  assetAddress?: string;
  assetSymbol?: string;
  amount?: string;
  mandateId?: string;
  payloadHash: string;
  payloadRef?: string;
  metadata?: Record<string, unknown>;
};

export type ApprovalInput = {
  decision: 'approved' | 'rejected';
  reason: string;
  approvalProofRef?: string;
};

export type UpdateOrganizationInput = {
  name?: string;
  defaultChainId?: number;
  riskMode?: string;
  complianceMode?: string;
};
