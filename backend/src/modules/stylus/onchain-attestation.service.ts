import { Injectable, Logger } from '@nestjs/common';
import {
  Address,
  Hex,
  getAddress,
  keccak256,
  stringToHex,
} from 'viem';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { AgentWalletsRepository } from '../../database/repositories/agent-wallets.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { executionAmountWeiOrDefault } from '../../common/utils/amount.util';
import { hashPayload } from '../../common/utils/hash.util';
import {
  DEFAULT_E2E_ASSET,
  DEFAULT_SETTLEMENT_AMOUNT_WEI,
  MANDATE_SCOPE_HASH,
  MANDATE_STATUS_HASH,
  ORGANIZATION_HASH,
  POLICY_VERSION_HASH,
  PRINCIPAL_HASH,
} from '../../common/constants/onchain.constants';
import { ChainService } from '../settlement/chain.service';
import { MandateChainService } from './mandate-chain.service';
import { StylusEngineService } from './stylus-engine.service';

@Injectable()
export class OnChainAttestationService {
  private readonly logger = new Logger(OnChainAttestationService.name);

  constructor(
    private readonly executionsRepository: ExecutionsRepository,
    private readonly agentWalletsRepository: AgentWalletsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly chainService: ChainService,
    private readonly mandateChainService: MandateChainService,
    private readonly stylusEngineService: StylusEngineService,
  ) {}

  async attestExecution(executionId: string): Promise<void> {
    const execution = await this.executionsRepository.findById(executionId);
    if (!execution) return;

    const chainId = execution.target_chain_id;
    const wallet = await this.findAgentWallet(execution.agent_id, chainId);
    const signerAccount = this.chainService.getWalletClient(chainId).account;
    const fallbackAgent = signerAccount?.address;
    if (!fallbackAgent) {
      throw new Error('Settlement signer required for attestation');
    }
    const rawAgent = wallet?.wallet_address ?? fallbackAgent;
    const agentAddress = this.normalizeAddress(rawAgent, fallbackAgent);

    const executionHash = this.requireExecutionHash(execution.request_payload_hash);
    const target = this.normalizeAddress(execution.target_address ?? agentAddress, agentAddress);
    const asset = this.normalizeAddress(execution.asset_address ?? DEFAULT_E2E_ASSET, DEFAULT_E2E_ASSET);
    const amount = executionAmountWeiOrDefault(
      execution.value_amount,
      DEFAULT_SETTLEMENT_AMOUNT_WEI,
    );

    const attestationSeed = keccak256(
      stringToHex(`attestation-${execution.id}-${execution.idempotency_key}`),
    );
    const historicalSummaryHash = keccak256(stringToHex(`history-${execution.id}`));
    const externalRiskAttestationHash = keccak256(stringToHex(`external-risk-${execution.id}`));
    const eligibilityAttestationHash = keccak256(
      stringToHex(`eligibility-${execution.id}`),
    );
    const ruleCommitmentHash = keccak256(stringToHex(`rule-${execution.id}`));

    const mandateId = await this.mandateChainService.ensureActiveMandate(
      chainId,
      agentAddress,
      asset,
      amount,
    );

    const engineResult = await this.stylusEngineService.attestFromLiveEngines({
      chainId,
      executionHash,
      agent: agentAddress,
      mandateId,
      target,
      asset,
      amount,
      counterparty: target,
      attestationHash: attestationSeed,
      historicalSummaryHash,
      externalRiskAttestationHash,
      eligibilityAttestationHash,
      ruleCommitmentHash,
    });

    const onchain = {
      organizationHash: ORGANIZATION_HASH,
      agentAddress,
      mandateId,
      actionTypeHash: keccak256(stringToHex('transfer')),
      principalHash: PRINCIPAL_HASH,
      jurisdictionHash: keccak256(stringToHex('valen-compliance-rule-v1')),
      counterparty: target,
      attestationHashes: [attestationSeed],
      attestationExpiries: engineResult.attestationExpiries,
      amountFactor: engineResult.amountFactor,
      assetFactor: engineResult.assetFactor,
      counterpartyFactor: engineResult.counterpartyFactor,
      velocityFactor: engineResult.velocityFactor,
      mandateUsageFactor: engineResult.mandateUsageFactor,
      anomalyFactor: engineResult.anomalyFactor,
      complianceHash: engineResult.complianceHash,
      riskHash: engineResult.riskHash,
      policyVersionHash: POLICY_VERSION_HASH,
      mandateScopeHash: MANDATE_SCOPE_HASH,
      timeBucket: engineResult.timeBucket,
      ruleCommitmentHashes: [ruleCommitmentHash],
      mandateStatusHash: MANDATE_STATUS_HASH,
      eligibilityResultHash: engineResult.eligibilityResultHash,
      historicalSummaryHash,
      externalRiskAttestationHash,
      externalRiskExpiry: engineResult.externalRiskExpiry,
      eligibilityAttestationHash,
      eligibilityExpiry: engineResult.eligibilityExpiry,
      riskScore: engineResult.riskScore,
      riskTier: engineResult.riskTier,
      requiresApproval: engineResult.requiresApproval,
      callData: '0x',
    };

    await this.executionsRepository.mergeMetadata(executionId, { onchain });

    await this.auditLogsRepository.append({
      organizationId: execution.organization_id,
      actorType: 'system',
      actorId: 'stylus-attestation',
      action: 'execution.attested',
      entityType: 'execution',
      entityId: executionId,
      eventHash: hashPayload({ executionId, complianceHash: engineResult.complianceHash }),
      chainId,
    });

    this.logger.log(
      `Live Stylus attestation stored for execution ${executionId} compliance=${engineResult.complianceHash.slice(0, 12)}`,
    );
  }

  private requireExecutionHash(value: string): Hex {
    if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
      throw new Error('request_payload_hash must be a 32-byte hex string');
    }
    return value as Hex;
  }

  private async findAgentWallet(agentId: string, chainId: number) {
    const wallets = await this.agentWalletsRepository.listByAgent(agentId);
    return (
      wallets.find((w) => w.chain_id === chainId && w.is_primary && w.status === 'active') ??
      wallets.find((w) => w.chain_id === chainId && w.status === 'active') ??
      null
    );
  }

  private normalizeAddress(value: string, fallback: Address): Address {
    const candidate = value.trim();
    if (/^0x[0-9a-fA-F]{40}$/.test(candidate)) {
      return getAddress(candidate.toLowerCase() as Address);
    }
    return getAddress(fallback.toLowerCase() as Address);
  }
}
