import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  Address,
  Hex,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  encodePacked,
  http,
  keccak256,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AppConfig } from '../../config/config.types';
import { executionAmountWeiOrDefault } from '../../common/utils/amount.util';
import { writeContractWithFreshNonce } from '../../common/utils/chain-write.util';
import { resolveOnChainAssetAddress } from '../../common/utils/execution-asset.util';
import { ExecutionRow } from '../../database/repositories/executions.repository';
import { DEFAULT_SETTLEMENT_AMOUNT_WEI } from '../../common/constants/onchain.constants';

@Injectable()
export class ChainService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  getRpcUrl(chainId: number): string {
    if (chainId === 421614) {
      return this.configService.get('arbitrumSepoliaRpcUrl', { infer: true });
    }
    if (chainId === 46630) {
      return this.configService.get('robinhoodTestnetRpcUrl', { infer: true });
    }
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  getRegistryAddress(chainId: number): Address {
    if (chainId === 421614) {
      return this.configService.get('arbitrumSepoliaValenRegistry', {
        infer: true,
      });
    }
    if (chainId === 46630) {
      return this.configService.get('robinhoodTestnetValenRegistry', {
        infer: true,
      });
    }
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  getSettlementAddress(chainId: number): Address {
    if (chainId === 421614) {
      return this.configService.get('arbitrumSepoliaValenSettlement', {
        infer: true,
      });
    }
    if (chainId === 46630) {
      return this.configService.get('robinhoodTestnetValenSettlement', {
        infer: true,
      });
    }
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  getPublicClient(chainId: number): PublicClient {
    return createPublicClient({
      transport: http(this.getRpcUrl(chainId)),
    });
  }

  getWalletClient(chainId: number): WalletClient {
    const account = privateKeyToAccount(
      this.configService.get('settlementPrivateKey', { infer: true }),
    );
    return createWalletClient({
      account,
      transport: http(this.getRpcUrl(chainId)),
    });
  }
}

@Injectable()
export class AlchemyService {
  constructor(private readonly chainService: ChainService) {}

  async getTransactionStatus(chainId: number, txHash: Hex) {
    const publicClient = this.chainService.getPublicClient(chainId);
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    });

    return receipt;
  }
}

const settlementAbi = parseAbi([
  'function submitSettlement((bytes32 executionHash,bytes32 organizationHash,address agent,bytes32 mandateId,bytes32 actionType,uint64 targetChainId,address target,address asset,uint256 amount),(bytes32 principalHash,bytes32 jurisdictionHash,address counterparty,bytes32[] attestationHashes,uint64[] attestationExpiries),(uint16 amountFactor,uint16 assetFactor,uint16 counterpartyFactor,uint16 velocityFactor,uint16 mandateUsageFactor,uint16 anomalyFactor),(bytes32 complianceHash,bytes32 riskHash,bytes32 policyVersionHash,bytes32 mandateScopeHash,uint64 timeBucket),bytes32[] ruleCommitmentHashes,bytes32 mandateStatusHash,bytes32 eligibilityResultHash,bytes32 historicalSummaryHash,bytes32 externalRiskAttestationHash,uint64 externalRiskExpiry,bytes32 eligibilityAttestationHash,uint64 eligibilityExpiry,bytes callData) returns (bytes32)',
  'function approveSettlement(bytes32 settlementId)',
  'function executeSettlement(bytes32 settlementId, bytes callData) payable',
]);

type Bytes32 = `0x${string}`;

interface OnChainSettlementMetadata {
  organizationHash: Bytes32;
  agentAddress?: Address;
  mandateId: Bytes32;
  actionTypeHash: Bytes32;
  principalHash: Bytes32;
  jurisdictionHash: Bytes32;
  counterparty: Address;
  attestationHashes: Bytes32[];
  attestationExpiries: number[];
  amountFactor: number;
  assetFactor: number;
  counterpartyFactor: number;
  velocityFactor: number;
  mandateUsageFactor: number;
  anomalyFactor: number;
  complianceHash: Bytes32;
  riskHash: Bytes32;
  policyVersionHash: Bytes32;
  mandateScopeHash: Bytes32;
  timeBucket: number;
  ruleCommitmentHashes: Bytes32[];
  mandateStatusHash: Bytes32;
  eligibilityResultHash: Bytes32;
  historicalSummaryHash: Bytes32;
  externalRiskAttestationHash: Bytes32;
  externalRiskExpiry: number;
  eligibilityAttestationHash: Bytes32;
  eligibilityExpiry: number;
  callData: Hex;
}

export interface OnChainSettlementResult {
  settlementId: Bytes32;
  submitTxHash: Hex;
  approveTxHash: Hex;
  executeTxHash: Hex;
  executeBlockNumber: bigint;
}

function requireRecord(value: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Execution metadata.onchain is required for real settlement');
  }
  return value;
}

function requireHex(value: unknown, key: string, bytes?: number): `0x${string}` {
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    throw new Error(`metadata.onchain.${key} must be a hex string`);
  }
  if (bytes && value.length !== 2 + bytes * 2) {
    throw new Error(`metadata.onchain.${key} must be ${bytes} bytes`);
  }
  return value as `0x${string}`;
}

function requireAddress(value: unknown, key: string): Address {
  const hex = requireHex(value, key);
  if (!/^0x[0-9a-fA-F]{40}$/.test(hex)) {
    throw new Error(`metadata.onchain.${key} must be an EVM address`);
  }
  return hex;
}

function requireNumber(value: unknown, key: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`metadata.onchain.${key} must be a non-negative integer`);
  }
  return value;
}

function requireHexArray(value: unknown, key: string, bytes: number): `0x${string}`[] {
  if (!Array.isArray(value)) {
    throw new Error(`metadata.onchain.${key} must be an array`);
  }
  return value.map((item, index) => requireHex(item, `${key}[${index}]`, bytes));
}

function requireNumberArray(value: unknown, key: string): number[] {
  if (!Array.isArray(value)) {
    throw new Error(`metadata.onchain.${key} must be an array`);
  }
  return value.map((item, index) => requireNumber(item, `${key}[${index}]`));
}

function parseMetadata(execution: ExecutionRow): OnChainSettlementMetadata {
  const metadata = requireRecord(execution.metadata?.onchain as Record<string, unknown> | undefined);
  return {
    organizationHash: requireHex(metadata.organizationHash, 'organizationHash', 32),
    agentAddress: metadata.agentAddress
      ? requireAddress(metadata.agentAddress, 'agentAddress')
      : undefined,
    mandateId: requireHex(metadata.mandateId, 'mandateId', 32),
    actionTypeHash: requireHex(metadata.actionTypeHash, 'actionTypeHash', 32),
    principalHash: requireHex(metadata.principalHash, 'principalHash', 32),
    jurisdictionHash: requireHex(metadata.jurisdictionHash, 'jurisdictionHash', 32),
    counterparty: requireAddress(metadata.counterparty, 'counterparty'),
    attestationHashes: requireHexArray(metadata.attestationHashes, 'attestationHashes', 32),
    attestationExpiries: requireNumberArray(metadata.attestationExpiries, 'attestationExpiries'),
    amountFactor: requireNumber(metadata.amountFactor, 'amountFactor'),
    assetFactor: requireNumber(metadata.assetFactor, 'assetFactor'),
    counterpartyFactor: requireNumber(metadata.counterpartyFactor, 'counterpartyFactor'),
    velocityFactor: requireNumber(metadata.velocityFactor, 'velocityFactor'),
    mandateUsageFactor: requireNumber(metadata.mandateUsageFactor, 'mandateUsageFactor'),
    anomalyFactor: requireNumber(metadata.anomalyFactor, 'anomalyFactor'),
    complianceHash: requireHex(metadata.complianceHash, 'complianceHash', 32),
    riskHash: requireHex(metadata.riskHash, 'riskHash', 32),
    policyVersionHash: requireHex(metadata.policyVersionHash, 'policyVersionHash', 32),
    mandateScopeHash: requireHex(metadata.mandateScopeHash, 'mandateScopeHash', 32),
    timeBucket: requireNumber(metadata.timeBucket, 'timeBucket'),
    ruleCommitmentHashes: requireHexArray(
      metadata.ruleCommitmentHashes,
      'ruleCommitmentHashes',
      32,
    ),
    mandateStatusHash: requireHex(metadata.mandateStatusHash, 'mandateStatusHash', 32),
    eligibilityResultHash: requireHex(metadata.eligibilityResultHash, 'eligibilityResultHash', 32),
    historicalSummaryHash: requireHex(metadata.historicalSummaryHash, 'historicalSummaryHash', 32),
    externalRiskAttestationHash: requireHex(
      metadata.externalRiskAttestationHash,
      'externalRiskAttestationHash',
      32,
    ),
    externalRiskExpiry: requireNumber(metadata.externalRiskExpiry, 'externalRiskExpiry'),
    eligibilityAttestationHash: requireHex(
      metadata.eligibilityAttestationHash,
      'eligibilityAttestationHash',
      32,
    ),
    eligibilityExpiry: requireNumber(metadata.eligibilityExpiry, 'eligibilityExpiry'),
    callData: requireHex(metadata.callData, 'callData'),
  };
}

function requireExecutionHash(execution: ExecutionRow): Bytes32 {
  return requireHex(execution.request_payload_hash, 'requestPayloadHash', 32);
}

function getNativeValue(execution: ExecutionRow): bigint {
  if (!execution.value_amount) {
    return 0n;
  }
  return executionAmountWeiOrDefault(execution.value_amount, DEFAULT_SETTLEMENT_AMOUNT_WEI);
}

@Injectable()
export class SettlementChainService {
  constructor(private readonly chainService: ChainService) {}

  async executeSettlement(execution: ExecutionRow): Promise<OnChainSettlementResult> {
    const metadata = parseMetadata(execution);
    const chainId = execution.target_chain_id;
    const settlementAddress = this.chainService.getSettlementAddress(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const walletClient = this.chainService.getWalletClient(chainId);
    const account = walletClient.account;
    if (!account) throw new Error('Settlement wallet account is not configured');

    const executionHash = requireExecutionHash(execution);
    const target = execution.target_address
      ? requireAddress(execution.target_address, 'execution.targetAddress')
      : requireAddress(undefined, 'execution.targetAddress');
    const asset = resolveOnChainAssetAddress(execution.asset_address);
    const amount = getNativeValue(execution);
    const agent = metadata.agentAddress ?? account.address;

    const intent = {
      executionHash,
      organizationHash: metadata.organizationHash,
      agent,
      mandateId: metadata.mandateId,
      actionType: metadata.actionTypeHash,
      targetChainId: BigInt(chainId),
      target,
      asset,
      amount,
    };
    const complianceContext = {
      principalHash: metadata.principalHash,
      jurisdictionHash: metadata.jurisdictionHash,
      counterparty: metadata.counterparty,
      attestationHashes: metadata.attestationHashes,
      attestationExpiries: metadata.attestationExpiries.map(BigInt),
    };
    const riskFactors = {
      amountFactor: metadata.amountFactor,
      assetFactor: metadata.assetFactor,
      counterpartyFactor: metadata.counterpartyFactor,
      velocityFactor: metadata.velocityFactor,
      mandateUsageFactor: metadata.mandateUsageFactor,
      anomalyFactor: metadata.anomalyFactor,
    };
    const policyFacts = {
      complianceHash: metadata.complianceHash,
      riskHash: metadata.riskHash,
      policyVersionHash: metadata.policyVersionHash,
      mandateScopeHash: metadata.mandateScopeHash,
      timeBucket: BigInt(metadata.timeBucket),
    };

    const settlementId = keccak256(
      encodePacked(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [
          executionHash,
          metadata.mandateId,
          metadata.policyVersionHash,
          BigInt(chainId),
          settlementAddress,
        ],
      ),
    );

    const submitTxHash = await writeContractWithFreshNonce(publicClient, walletClient, {
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'submitSettlement',
      args: [
        intent,
        complianceContext,
        riskFactors,
        policyFacts,
        metadata.ruleCommitmentHashes,
        metadata.mandateStatusHash,
        metadata.eligibilityResultHash,
        metadata.historicalSummaryHash,
        metadata.externalRiskAttestationHash,
        BigInt(metadata.externalRiskExpiry),
        metadata.eligibilityAttestationHash,
        BigInt(metadata.eligibilityExpiry),
        metadata.callData,
      ],
      account,
      chain: null,
    });
    await publicClient.waitForTransactionReceipt({ hash: submitTxHash });

    const approveTxHash = await writeContractWithFreshNonce(publicClient, walletClient, {
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'approveSettlement',
      args: [settlementId],
      account,
      chain: null,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

    const executeTxHash = await writeContractWithFreshNonce(publicClient, walletClient, {
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'executeSettlement',
      args: [settlementId, metadata.callData],
      value: amount,
      account,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: executeTxHash,
    });

    if (receipt.status !== 'success') {
      throw new Error(`Settlement execution reverted: ${executeTxHash}`);
    }

    return {
      settlementId,
      submitTxHash,
      approveTxHash,
      executeTxHash,
      executeBlockNumber: receipt.blockNumber,
    };
  }
}
