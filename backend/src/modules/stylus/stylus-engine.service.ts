import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  Address,
  Hex,
  PublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  parseAbi,
} from 'viem';
import { ChainService } from '../settlement/chain.service';
import {
  ACTION_TYPE_TRANSFER,
  COMPLIANCE_RULE_HASH,
  DEFAULT_E2E_ASSET,
  DEFAULT_SETTLEMENT_AMOUNT_WEI,
  MANDATE_SCOPE_HASH,
  MANDATE_STATUS_HASH,
  ORGANIZATION_HASH,
  POLICY_VERSION_HASH,
  PRINCIPAL_HASH,
  riskTierLabel,
} from '../../common/constants/onchain.constants';

type ChainName = 'arbitrum-sepolia' | 'robinhood-testnet';

const eligibilityEngineAbi = parseAbi([
  'function check(bytes32 principalHash, address agent, address asset, address counterparty, bytes32 scopeHash, bytes32 eligibilityAttestationHash, uint64 expiry) view returns ((uint8 status, uint16 reasonCode, bytes32 resultHash, bytes32 engineVersion, uint64 expiresAt) verdict, bytes32 failedDimension)',
]);

const complianceEngineAbi = parseAbi([
  'function evaluate((bytes32 executionHash, bytes32 organizationHash, address agent, bytes32 mandateId, bytes32 actionType, uint64 targetChainId, address target, address asset, uint256 amount) intent, (bytes32 principalHash, bytes32 jurisdictionHash, address counterparty, bytes32[] attestationHashes, uint64[] attestationExpiries) context, bytes32 mandateStatusHash, bytes32 eligibilityResultHash) view returns ((uint8 status, uint16 reasonCode, bytes32 resultHash, bytes32 engineVersion, uint64 expiresAt) verdict, uint16 reason)',
]);

const riskEngineAbi = parseAbi([
  'function calculate((bytes32 executionHash, bytes32 organizationHash, address agent, bytes32 mandateId, bytes32 actionType, uint64 targetChainId, address target, address asset, uint256 amount) intent, (uint16 amountFactor, uint16 assetFactor, uint16 counterpartyFactor, uint16 velocityFactor, uint16 mandateUsageFactor, uint16 anomalyFactor) factors, bytes32 historicalSummaryHash, bytes32 externalRiskAttestationHash, uint64 externalRiskExpiry) view returns (uint16 score, uint8 tier, bool requiresApproval, bytes32 resultHash, (uint8 status, uint16 reasonCode, bytes32 resultHash, bytes32 engineVersion, uint64 expiresAt) verdict)',
]);

const policyEngineAbi = parseAbi([
  'function evaluate((bytes32 executionHash, bytes32 organizationHash, address agent, bytes32 mandateId, bytes32 actionType, uint64 targetChainId, address target, address asset, uint256 amount) intent, (bytes32 complianceHash, bytes32 riskHash, bytes32 policyVersionHash, bytes32 mandateScopeHash, uint64 timeBucket) facts, uint8 riskTier, uint16 riskScore, bytes32[] ruleCommitmentHashes) view returns ((uint8 status, uint16 reasonCode, bytes32 resultHash, bytes32 engineVersion, uint64 expiresAt) verdict, uint8 reason, uint8 approvalLevel)',
]);

export interface EngineAddresses {
  ComplianceEngine: Address;
  RiskEngine: Address;
  EligibilityEngine: Address;
  PolicyEngine: Address;
}

export interface LiveEngineAttestationInput {
  chainId: number;
  executionHash: Hex;
  agent: Address;
  mandateId: Hex;
  target: Address;
  asset?: Address;
  amount?: bigint;
  counterparty?: Address;
  attestationHash: Hex;
  historicalSummaryHash: Hex;
  externalRiskAttestationHash: Hex;
  eligibilityAttestationHash: Hex;
  ruleCommitmentHash: Hex;
}

export interface LiveEngineAttestationResult {
  complianceHash: Hex;
  riskHash: Hex;
  eligibilityResultHash: Hex;
  riskScore: number;
  riskTier: ReturnType<typeof riskTierLabel>;
  requiresApproval: boolean;
  timeBucket: number;
  attestationExpiries: number[];
  externalRiskExpiry: number;
  eligibilityExpiry: number;
  amountFactor: number;
  assetFactor: number;
  counterpartyFactor: number;
  velocityFactor: number;
  mandateUsageFactor: number;
  anomalyFactor: number;
}

@Injectable()
export class StylusEngineService {
  private readonly repoRoot: string;

  constructor(private readonly chainService: ChainService) {
    this.repoRoot = join(process.cwd(), '..');
  }

  resolveChainName(chainId: number): ChainName {
    if (chainId === 421614) return 'arbitrum-sepolia';
    if (chainId === 46630) return 'robinhood-testnet';
    throw new Error(`Unsupported chain ID for Stylus engines: ${chainId}`);
  }

  loadEngineAddresses(chainId: number): EngineAddresses {
    const chainName = this.resolveChainName(chainId);
    const path = join(
      this.repoRoot,
      'stylus',
      'deployments',
      chainName,
      'engines.json',
    );
    if (!existsSync(path)) {
      throw new Error(`Stylus engine deployment file missing: ${path}`);
    }
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<
      string,
      { address: string }
    >;
    return {
      ComplianceEngine: raw.ComplianceEngine.address as Address,
      RiskEngine: raw.RiskEngine.address as Address,
      EligibilityEngine: raw.EligibilityEngine.address as Address,
      PolicyEngine: raw.PolicyEngine.address as Address,
    };
  }

  async attestFromLiveEngines(
    input: LiveEngineAttestationInput,
  ): Promise<LiveEngineAttestationResult> {
    const chainId = input.chainId;
    const publicClient = this.chainService.getPublicClient(chainId);
    const settlementAddress = this.chainService.getSettlementAddress(chainId);
    const engines = this.loadEngineAddresses(chainId);

    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const now = Number(block.timestamp);
    const attestationExpiry = now + 3600;
    const externalRiskExpiry = now + 3600;
    const eligibilityExpiry = now + 3600;

    const asset = input.asset ?? DEFAULT_E2E_ASSET;
    const amount = input.amount ?? DEFAULT_SETTLEMENT_AMOUNT_WEI;
    const counterparty = input.counterparty ?? input.agent;
    const target = input.target;

    const intent = {
      executionHash: input.executionHash,
      organizationHash: ORGANIZATION_HASH,
      agent: input.agent,
      mandateId: input.mandateId,
      actionType: ACTION_TYPE_TRANSFER,
      targetChainId: BigInt(chainId),
      target,
      asset,
      amount,
    };

    const complianceContext = {
      principalHash: PRINCIPAL_HASH,
      jurisdictionHash: COMPLIANCE_RULE_HASH,
      counterparty,
      attestationHashes: [input.attestationHash],
      attestationExpiries: [BigInt(attestationExpiry)],
    };

    const riskFactors = {
      amountFactor: 10,
      assetFactor: 10,
      counterpartyFactor: 10,
      velocityFactor: 10,
      mandateUsageFactor: 10,
      anomalyFactor: 10,
    };

    const eligibilityRaw = await this.callEngine(
      publicClient,
      engines.EligibilityEngine,
      settlementAddress,
      encodeFunctionData({
        abi: eligibilityEngineAbi,
        functionName: 'check',
        args: [
          PRINCIPAL_HASH,
          input.agent,
          asset,
          counterparty,
          MANDATE_SCOPE_HASH,
          input.eligibilityAttestationHash,
          BigInt(eligibilityExpiry),
        ],
      }),
    );
    const eligibilityDecoded = decodeFunctionResult({
      abi: eligibilityEngineAbi,
      functionName: 'check',
      data: eligibilityRaw,
    }) as readonly [{ resultHash: Hex }, Hex];
    const eligibilityResultHash = eligibilityDecoded[0].resultHash;

    const complianceRaw = await this.callEngine(
      publicClient,
      engines.ComplianceEngine,
      settlementAddress,
      encodeFunctionData({
        abi: complianceEngineAbi,
        functionName: 'evaluate',
        args: [intent, complianceContext, MANDATE_STATUS_HASH, eligibilityResultHash],
      }),
    );
    const complianceDecoded = decodeFunctionResult({
      abi: complianceEngineAbi,
      functionName: 'evaluate',
      data: complianceRaw,
    }) as readonly [{ resultHash: Hex }, number];
    const complianceHash = complianceDecoded[0].resultHash;

    const riskRaw = await this.callEngine(
      publicClient,
      engines.RiskEngine,
      settlementAddress,
      encodeFunctionData({
        abi: riskEngineAbi,
        functionName: 'calculate',
        args: [
          intent,
          riskFactors,
          input.historicalSummaryHash,
          input.externalRiskAttestationHash,
          BigInt(externalRiskExpiry),
        ],
      }),
    );
    const riskDecoded = decodeFunctionResult({
      abi: riskEngineAbi,
      functionName: 'calculate',
      data: riskRaw,
    }) as readonly [number, number, boolean, Hex, unknown];
    const riskScore = Number(riskDecoded[0]);
    const riskTier = riskTierLabel(Number(riskDecoded[1]));
    const requiresApproval = Boolean(riskDecoded[2]);
    const riskHash = riskDecoded[3];

    const policyFacts = {
      complianceHash,
      riskHash,
      policyVersionHash: POLICY_VERSION_HASH,
      mandateScopeHash: MANDATE_SCOPE_HASH,
      timeBucket: BigInt(now),
    };

    await this.callEngine(
      publicClient,
      engines.PolicyEngine,
      settlementAddress,
      encodeFunctionData({
        abi: policyEngineAbi,
        functionName: 'evaluate',
        args: [
          intent,
          policyFacts,
          Number(riskDecoded[1]),
          riskScore,
          [input.ruleCommitmentHash],
        ],
      }),
    );

    return {
      complianceHash,
      riskHash,
      eligibilityResultHash,
      riskScore,
      riskTier,
      requiresApproval,
      timeBucket: now,
      attestationExpiries: [attestationExpiry],
      externalRiskExpiry,
      eligibilityExpiry,
      amountFactor: riskFactors.amountFactor,
      assetFactor: riskFactors.assetFactor,
      counterpartyFactor: riskFactors.counterpartyFactor,
      velocityFactor: riskFactors.velocityFactor,
      mandateUsageFactor: riskFactors.mandateUsageFactor,
      anomalyFactor: riskFactors.anomalyFactor,
    };
  }

  private async callEngine(
    publicClient: PublicClient,
    engineAddress: Address,
    settlementAddress: Address,
    data: Hex,
  ): Promise<Hex> {
    const { data: returnData } = await publicClient.call({
      to: engineAddress,
      data,
      account: getAddress(settlementAddress.toLowerCase() as Address),
    });
    if (!returnData || returnData === '0x') {
      throw new Error(`Stylus engine ${engineAddress} returned empty data`);
    }
    return returnData;
  }
}
