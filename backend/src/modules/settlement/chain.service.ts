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
import { readStoredBaseUnits } from '../../common/utils/amount.util';
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

  getBudgetVaultAddress(chainId: number): Address | null {
    if (chainId !== 421614) return null;
    const address = this.configService.get('valenBudgetVaultAddress', { infer: true });
    return address ?? null;
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
  'function getSettlement(bytes32 settlementId) view returns ((bytes32 settlementId, bytes32 executionHash, bytes32 organizationHash, bytes32 mandateId, bytes32 policyHash, bytes32 complianceHash, bytes32 riskHash, address agent, address target, address asset, uint256 value, bytes32 callDataHash, bytes32 actionHash, uint8 status, uint16 reasonCode))',
  'function tokenSettlementAdapter() view returns (address)',
  'function tokenSettlementAssetEnabled(address asset) view returns (bool)',
]);

const erc20Abi = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
]);

const budgetVaultAbi = parseAbi([
  'function commitSpend(bytes32 executionHash, uint256 amount) external',
]);

const SETTLEMENT_STATUS = {
  none: 0,
  requested: 1,
  approved: 2,
  executed: 3,
  failed: 4,
  cancelled: 5,
} as const;

const EMPTY_TX_HASH = `0x${'0'.repeat(64)}` as Hex;

function isSettlementAlreadyUsedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('SettlementAlreadyUsed') || message.includes('0x087103d2');
}

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
  settlementMode: 'native' | 'erc20';
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
  return readStoredBaseUnits(execution.value_amount, DEFAULT_SETTLEMENT_AMOUNT_WEI);
}

@Injectable()
export class SettlementChainService {
  constructor(private readonly chainService: ChainService) {}

  private async readOnChainSettlementStatus(
    publicClient: PublicClient,
    settlementAddress: Address,
    settlementId: Bytes32,
  ): Promise<number | null> {
    try {
      const record = await publicClient.readContract({
        address: settlementAddress,
        abi: settlementAbi,
        functionName: 'getSettlement',
        args: [settlementId],
      });
      return Number(record.status);
    } catch {
      return null;
    }
  }

  private async isTokenSettlementAsset(
    publicClient: PublicClient,
    settlementAddress: Address,
    asset: Address,
  ): Promise<boolean> {
    try {
      return await publicClient.readContract({
        address: settlementAddress,
        abi: settlementAbi,
        functionName: 'tokenSettlementAssetEnabled',
        args: [asset],
      });
    } catch {
      return false;
    }
  }

  private async getTokenSettlementAdapter(
    publicClient: PublicClient,
    settlementAddress: Address,
  ): Promise<Address> {
    const adapter = await publicClient.readContract({
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'tokenSettlementAdapter',
    });
    if (!/^0x[0-9a-fA-F]{40}$/.test(adapter) || /^0x0{40}$/i.test(adapter)) {
      throw new Error(`Token settlement adapter is not configured for ${settlementAddress}`);
    }
    return adapter as Address;
  }

  private async assertTokenSettlementFunding(
    publicClient: PublicClient,
    token: Address,
    owner: Address,
    spender: Address,
    amount: bigint,
  ): Promise<void> {
    const [balance, allowance] = await Promise.all([
      publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [owner],
      }),
      publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, spender],
      }),
    ]);

    if (balance < amount) {
      throw new Error(`Insufficient token balance for ${owner}: have ${balance}, need ${amount}`);
    }
    if (allowance < amount) {
      throw new Error(`Insufficient token allowance for ${owner} -> ${spender}: have ${allowance}, need ${amount}`);
    }
  }

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
    const tokenSettlement = await this.isTokenSettlementAsset(
      publicClient,
      settlementAddress,
      asset,
    );

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

    let onChainStatus =
      (await this.readOnChainSettlementStatus(publicClient, settlementAddress, settlementId)) ??
      SETTLEMENT_STATUS.none;

    if (onChainStatus === SETTLEMENT_STATUS.executed) {
      return {
        settlementId,
        submitTxHash: EMPTY_TX_HASH,
        approveTxHash: EMPTY_TX_HASH,
        executeTxHash: EMPTY_TX_HASH,
        executeBlockNumber: 0n,
        settlementMode: tokenSettlement ? 'erc20' : 'native',
      };
    }

    let submitTxHash = EMPTY_TX_HASH;
    if (onChainStatus < SETTLEMENT_STATUS.requested) {
      try {
        submitTxHash = await writeContractWithFreshNonce(publicClient, walletClient, {
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
        onChainStatus = SETTLEMENT_STATUS.requested;
      } catch (error) {
        if (!isSettlementAlreadyUsedError(error)) {
          throw error;
        }
        onChainStatus =
          (await this.readOnChainSettlementStatus(publicClient, settlementAddress, settlementId)) ??
          SETTLEMENT_STATUS.requested;
      }
    }

    let approveTxHash = EMPTY_TX_HASH;
    if (onChainStatus === SETTLEMENT_STATUS.requested) {
      approveTxHash = await writeContractWithFreshNonce(publicClient, walletClient, {
        address: settlementAddress,
        abi: settlementAbi,
        functionName: 'approveSettlement',
        args: [settlementId],
        account,
        chain: null,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      onChainStatus = SETTLEMENT_STATUS.approved;
    }

    if (onChainStatus < SETTLEMENT_STATUS.approved) {
      throw new Error(`Settlement ${settlementId} is not approved on chain (status=${onChainStatus})`);
    }

    const tokenAdapter = tokenSettlement
      ? await this.getTokenSettlementAdapter(publicClient, settlementAddress)
      : null;

    if (tokenSettlement) {
      await this.assertTokenSettlementFunding(publicClient, asset, agent, tokenAdapter!, amount);
      const vaultAddress = this.chainService.getBudgetVaultAddress(chainId);
      if (vaultAddress) {
        const vaultTxHash = await writeContractWithFreshNonce(publicClient, walletClient, {
          address: vaultAddress,
          abi: budgetVaultAbi,
          functionName: 'commitSpend',
          args: [executionHash, amount],
          account,
          chain: null,
        });
        const vaultReceipt = await publicClient.waitForTransactionReceipt({ hash: vaultTxHash });
        if (vaultReceipt.status !== 'success') {
          throw new Error(`Budget vault commitSpend reverted: ${vaultTxHash}`);
        }
      }
    } else {
      const relayerBalance = await publicClient.getBalance({ address: account.address });
      if (relayerBalance < amount) {
        throw new Error(
          `Insufficient relayer balance on chain ${chainId}: have ${relayerBalance} wei, need ${amount} wei for settlement execution`,
        );
      }
    }

    const executeTxHash = await writeContractWithFreshNonce(publicClient, walletClient, {
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'executeSettlement',
      args: [settlementId, metadata.callData],
      value: tokenSettlement ? 0n : amount,
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
      settlementMode: tokenSettlement ? 'erc20' : 'native',
    };
  }
}
