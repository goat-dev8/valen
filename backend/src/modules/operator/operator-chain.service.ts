import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  Address,
  Hex,
  createPublicClient,
  formatEther,
  http,
  keccak256,
  parseAbi,
  stringToHex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AppConfig } from '../../config/config.types';
import { ChainService } from '../settlement/chain.service';

const SOLIDITY_CONTRACTS = [
  'ValenRegistry',
  'ValenSettlement',
  'ValenTreasury',
  'ValenEscrow',
  'ValenGovernance',
  'ValenTimelock',
  'ValenMandateRegistry',
  'ValenPolicyManager',
  'ValenAuditLog',
  'ValenEmergencyGuardian',
] as const;

const STYLUS_ENGINES = [
  'ComplianceEngine',
  'RiskEngine',
  'EligibilityEngine',
  'PolicyEngine',
] as const;

const registryAbi = parseAbi([
  'function getEngine(bytes32 nameHash) view returns (address engineAddr, string version)',
  'function getChainSupport(uint256 chainId) view returns (bool enabled, bool stylusSupported)',
]);

const pausableAbi = parseAbi([
  'function paused() view returns (bool)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
]);

const settlementAbi = parseAbi([
  'function registry() view returns (address)',
  'function treasury() view returns (address)',
  'function paused() view returns (bool)',
  'function submitSettlement((bytes32 executionHash,bytes32 organizationHash,address agent,bytes32 mandateId,bytes32 actionType,uint64 targetChainId,address target,address asset,uint256 amount),(bytes32 principalHash,bytes32 jurisdictionHash,address counterparty,bytes32[] attestationHashes,uint64[] attestationExpiries),(uint16 amountFactor,uint16 assetFactor,uint16 counterpartyFactor,uint16 velocityFactor,uint16 mandateUsageFactor,uint16 anomalyFactor),(bytes32 complianceHash,bytes32 riskHash,bytes32 policyVersionHash,bytes32 mandateScopeHash,uint64 timeBucket),bytes32[] ruleCommitmentHashes,bytes32 mandateStatusHash,bytes32 eligibilityResultHash,bytes32 historicalSummaryHash,bytes32 externalRiskAttestationHash,uint64 externalRiskExpiry,bytes32 eligibilityAttestationHash,uint64 eligibilityExpiry,bytes callData) returns (bytes32)',
  'function approveSettlement(bytes32 settlementId)',
  'function executeSettlement(bytes32 settlementId, bytes callData) payable',
]);

const treasuryAbi = parseAbi([
  'function accruedFees(address asset) view returns (uint256)',
  'function collectedFees(address asset) view returns (uint256)',
]);

const governanceAbi = parseAbi([
  'function timelock() view returns (address)',
  'function registerProposal(bytes32 proposalHash, bytes32 metadataHash)',
  'function queueAction(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)',
  'function executeAction(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)',
  'function isActionQueued(bytes32 operationId) view returns (bool)',
]);

const timelockAbi = parseAbi([
  'function getMinDelay() view returns (uint256)',
  'function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) view returns (bytes32)',
  'function PROPOSER_ROLE() view returns (bytes32)',
  'function EXECUTOR_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
]);

const stylusEngineAbi = parseAbi([
  'function getEngineVersion() view returns (bytes32)',
]);

const auditLogAbi = parseAbi([
  'function commitmentExists(bytes32 commitmentHash) view returns (bool)',
]);

type ChainName = 'arbitrum-sepolia' | 'robinhood-testnet';

@Injectable()
export class OperatorChainService {
  private readonly repoRoot: string;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly chainService: ChainService,
  ) {
    this.repoRoot = join(process.cwd(), '..');
  }

  resolveChainName(chainId: number): ChainName {
    if (chainId === 421614) return 'arbitrum-sepolia';
    if (chainId === 46630) return 'robinhood-testnet';
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  getRpcUrl(chainId: number): string {
    return this.chainService.getRpcUrl(chainId);
  }

  loadDeployment(chainId: number) {
    const network = this.resolveChainName(chainId);
    const path = join(this.repoRoot, 'contracts', 'deployments', network, 'deployment.json');
    if (!existsSync(path)) {
      throw new Error(`Deployment file missing: ${path}`);
    }
    return JSON.parse(readFileSync(path, 'utf8')) as {
      chainId: string;
      contracts: Record<string, { address: string; implementation?: string }>;
    };
  }

  loadEngines(chainId: number) {
    const network = this.resolveChainName(chainId);
    const path = join(this.repoRoot, 'stylus', 'deployments', network, 'engines.json');
    if (!existsSync(path)) {
      throw new Error(`Engine deployment file missing: ${path}`);
    }
    return JSON.parse(readFileSync(path, 'utf8')) as Record<
      string,
      { address: string; version: string }
    >;
  }

  async pingRpc(chainId: number): Promise<{ ok: boolean; blockNumber: bigint; latencyMs: number }> {
    const start = Date.now();
    const client = createPublicClient({
      transport: http(this.getRpcUrl(chainId)),
    });
    const blockNumber = await client.getBlockNumber();
    return { ok: true, blockNumber, latencyMs: Date.now() - start };
  }

  async getContractPanel(chainId: number) {
    const deployment = this.loadDeployment(chainId);
    const client = createPublicClient({
      transport: http(this.getRpcUrl(chainId)),
    });
    const account = privateKeyToAccount(
      this.configService.get('settlementPrivateKey', { infer: true }),
    );
    const adminRole = keccak256(stringToHex('ADMIN_ROLE'));

    const contracts = [];
    for (const name of SOLIDITY_CONTRACTS) {
      const entry = deployment.contracts[name];
      if (!entry?.address) continue;
      const address = entry.address as Address;
      const bytecode = await client.getBytecode({ address });
      let paused: boolean | null = null;
      let ownerOrAdmin: string | null = null;
      try {
        paused = await client.readContract({
          address,
          abi: pausableAbi,
          functionName: 'paused',
        });
      } catch {
        paused = null;
      }
      try {
        const isAdmin = await client.readContract({
          address,
          abi: pausableAbi,
          functionName: 'hasRole',
          args: [adminRole, account.address],
        });
        ownerOrAdmin = isAdmin ? account.address : null;
      } catch {
        ownerOrAdmin = null;
      }

      contracts.push({
        name,
        address,
        chainId,
        chain: this.resolveChainName(chainId),
        bytecodeExists: Boolean(bytecode && bytecode !== '0x'),
        implementation: entry.implementation ?? null,
        paused,
        ownerOrAdmin,
        version: entry.implementation ? 'UUPS proxy' : 'direct',
      });
    }

    return { chainId, contracts };
  }

  async getStylusPanel(chainId: number) {
    const deployment = this.loadDeployment(chainId);
    const engines = this.loadEngines(chainId);
    const client = createPublicClient({
      transport: http(this.getRpcUrl(chainId)),
    });
    const registryAddress = deployment.contracts.ValenRegistry.address as Address;
    const settlementAddress = deployment.contracts.ValenSettlement.address as Address;

    const panel = [];
    for (const name of STYLUS_ENGINES) {
      const engine = engines[name];
      const address = engine.address as Address;
      const bytecode = await client.getBytecode({ address });
      let onChainVersion: Hex | null = null;
      let registryRegistered = false;
      let registryVersion: string | null = null;

      try {
        onChainVersion = await client.readContract({
          address,
          abi: stylusEngineAbi,
          functionName: 'getEngineVersion',
        });
      } catch {
        onChainVersion = null;
      }

      try {
        const nameHash = keccak256(stringToHex(name));
        const [registered, version] = await client.readContract({
          address: registryAddress,
          abi: registryAbi,
          functionName: 'getEngine',
          args: [nameHash],
        });
        registryRegistered =
          registered.toLowerCase() === address.toLowerCase() &&
          registered !== '0x0000000000000000000000000000000000000000';
        registryVersion = version;
      } catch {
        registryRegistered = false;
      }

      panel.push({
        name,
        address,
        deployedVersion: engine.version,
        onChainVersion,
        expectedAuthorizedCaller: settlementAddress,
        registryRegistered,
        registryVersion,
        bytecodeExists: Boolean(bytecode && bytecode !== '0x'),
        healthy:
          Boolean(bytecode && bytecode !== '0x') &&
          registryRegistered &&
          registryVersion === engine.version,
      });
    }

    return { chainId, engines: panel };
  }

  async getTreasuryPanel(chainId: number) {
    const deployment = this.loadDeployment(chainId);
    const client = createPublicClient({
      transport: http(this.getRpcUrl(chainId)),
    });
    const treasuryAddress = deployment.contracts.ValenTreasury.address as Address;
    const nativeAsset = '0x0000000000000000000000000000000000000000' as Address;
    const balance = await client.getBalance({ address: treasuryAddress });

    let accrued = 0n;
    let collected = 0n;
    try {
      accrued = await client.readContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: 'accruedFees',
        args: [nativeAsset],
      });
      collected = await client.readContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: 'collectedFees',
        args: [nativeAsset],
      });
    } catch {
      accrued = 0n;
      collected = 0n;
    }

    return {
      chainId,
      treasuryAddress,
      nativeBalanceWei: balance.toString(),
      nativeBalanceEth: formatEther(balance),
      accruedFeesWei: accrued.toString(),
      collectedFeesWei: collected.toString(),
    };
  }

  async submitSettlementOnChain(chainId: number, payload: Record<string, unknown>) {
    return this.runSettlementStep(chainId, payload, 'submit');
  }

  async approveSettlementOnChain(chainId: number, settlementId: Hex) {
    const walletClient = this.chainService.getWalletClient(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const settlementAddress = this.chainService.getSettlementAddress(chainId);
    const account = walletClient.account;
    if (!account) throw new Error('Wallet not configured');

    const txHash = await walletClient.writeContract({
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'approveSettlement',
      args: [settlementId],
      account,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return { txHash, blockNumber: receipt.blockNumber.toString(), status: receipt.status };
  }

  async executeSettlementOnChain(
    chainId: number,
    settlementId: Hex,
    callData: Hex,
    valueWei = '0',
  ) {
    const walletClient = this.chainService.getWalletClient(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const settlementAddress = this.chainService.getSettlementAddress(chainId);
    const account = walletClient.account;
    if (!account) throw new Error('Wallet not configured');

    const txHash = await walletClient.writeContract({
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'executeSettlement',
      args: [settlementId, callData],
      value: BigInt(valueWei),
      account,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return { txHash, blockNumber: receipt.blockNumber.toString(), status: receipt.status };
  }

  async registerGovernanceProposal(chainId: number, proposalHash: Hex, metadataHash: Hex) {
    const walletClient = this.chainService.getWalletClient(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const deployment = this.loadDeployment(chainId);
    const governanceAddress = deployment.contracts.ValenGovernance.address as Address;
    const account = walletClient.account;
    if (!account) throw new Error('Wallet not configured');

    const txHash = await walletClient.writeContract({
      address: governanceAddress,
      abi: governanceAbi,
      functionName: 'registerProposal',
      args: [proposalHash, metadataHash],
      account,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return { txHash, blockNumber: receipt.blockNumber.toString(), status: receipt.status };
  }

  async queueGovernanceAction(
    chainId: number,
    target: Address,
    valueWei: string,
    data: Hex,
    predecessor: Hex,
    salt: Hex,
    delay: number,
  ) {
    const walletClient = this.chainService.getWalletClient(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const deployment = this.loadDeployment(chainId);
    const governanceAddress = deployment.contracts.ValenGovernance.address as Address;
    const timelockAddress = deployment.contracts.ValenTimelock.address as Address;
    const account = walletClient.account;
    if (!account) throw new Error('Wallet not configured');

    const operationId = await publicClient.readContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'hashOperation',
      args: [target, BigInt(valueWei), data, predecessor, salt],
    });

    const txHash = await walletClient.writeContract({
      address: governanceAddress,
      abi: governanceAbi,
      functionName: 'queueAction',
      args: [target, BigInt(valueWei), data, predecessor, salt, BigInt(delay)],
      account,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return {
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      status: receipt.status,
      operationId,
    };
  }

  async executeGovernanceAction(
    chainId: number,
    target: Address,
    valueWei: string,
    data: Hex,
    predecessor: Hex,
    salt: Hex,
  ) {
    const walletClient = this.chainService.getWalletClient(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const deployment = this.loadDeployment(chainId);
    const governanceAddress = deployment.contracts.ValenGovernance.address as Address;
    const account = walletClient.account;
    if (!account) throw new Error('Wallet not configured');

    const txHash = await walletClient.writeContract({
      address: governanceAddress,
      abi: governanceAbi,
      functionName: 'executeAction',
      args: [target, BigInt(valueWei), data, predecessor, salt],
      account,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return { txHash, blockNumber: receipt.blockNumber.toString(), status: receipt.status };
  }

  async getGovernanceStatus(chainId: number) {
    const deployment = this.loadDeployment(chainId);
    const client = createPublicClient({
      transport: http(this.getRpcUrl(chainId)),
    });
    const governanceAddress = deployment.contracts.ValenGovernance.address as Address;
    const timelockAddress = deployment.contracts.ValenTimelock.address as Address;
    const linkedTimelock = await client.readContract({
      address: governanceAddress,
      abi: governanceAbi,
      functionName: 'timelock',
    });
    const minDelay = await client.readContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'getMinDelay',
    });
    const [proposerRole, executorRole] = await Promise.all([
      client.readContract({
        address: timelockAddress,
        abi: timelockAbi,
        functionName: 'PROPOSER_ROLE',
      }),
      client.readContract({
        address: timelockAddress,
        abi: timelockAbi,
        functionName: 'EXECUTOR_ROLE',
      }),
    ]);
    const [governanceHasProposerRole, governanceHasExecutorRole] = await Promise.all([
      client.readContract({
        address: timelockAddress,
        abi: timelockAbi,
        functionName: 'hasRole',
        args: [proposerRole, governanceAddress],
      }),
      client.readContract({
        address: timelockAddress,
        abi: timelockAbi,
        functionName: 'hasRole',
        args: [executorRole, governanceAddress],
      }),
    ]);
    return {
      chainId,
      governanceAddress,
      timelockAddress,
      linkedTimelock,
      timelockLinked:
        linkedTimelock.toLowerCase() === timelockAddress.toLowerCase(),
      minDelaySeconds: minDelay.toString(),
      governanceHasProposerRole,
      governanceHasExecutorRole,
    };
  }

  async verifyContractsLive(chainId: number) {
    const deployment = this.loadDeployment(chainId);
    const client = createPublicClient({
      transport: http(this.getRpcUrl(chainId)),
    });
    const registryAddress = deployment.contracts.ValenRegistry.address as Address;
    const [chainSupport] = await Promise.all([
      client.readContract({
        address: registryAddress,
        abi: registryAbi,
        functionName: 'getChainSupport',
        args: [BigInt(chainId)],
      }),
    ]);

    for (const name of SOLIDITY_CONTRACTS) {
      const address = deployment.contracts[name]?.address as Address;
      const code = await client.getBytecode({ address });
      if (!code || code === '0x') {
        throw new Error(`${name} has no bytecode at ${address}`);
      }
    }

    const stylus = await this.getStylusPanel(chainId);
    const unhealthy = stylus.engines.filter((e) => !e.healthy);
    if (unhealthy.length > 0) {
      throw new Error(
        `Unhealthy Stylus engines: ${unhealthy.map((e) => e.name).join(', ')}`,
      );
    }

    return {
      chainId,
      chainSupport: { enabled: chainSupport[0], stylusSupported: chainSupport[1] },
      contractsChecked: SOLIDITY_CONTRACTS.length,
      enginesChecked: STYLUS_ENGINES.length,
    };
  }

  private async runSettlementStep(
    chainId: number,
    payload: Record<string, unknown>,
    step: 'submit',
  ) {
    const walletClient = this.chainService.getWalletClient(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const settlementAddress = this.chainService.getSettlementAddress(chainId);
    const account = walletClient.account;
    if (!account) throw new Error('Wallet not configured');

    const intent = payload.intent as Record<string, unknown>;
    const complianceContext = payload.complianceContext as Record<string, unknown>;
    const riskFactors = payload.riskFactors as Record<string, unknown>;
    const policyFacts = payload.policyFacts as Record<string, unknown>;

    const txHash = await walletClient.writeContract({
      address: settlementAddress,
      abi: settlementAbi,
      functionName: 'submitSettlement',
      args: [
        {
          executionHash: intent.executionHash as Hex,
          organizationHash: intent.organizationHash as Hex,
          agent: intent.agent as Address,
          mandateId: intent.mandateId as Hex,
          actionType: intent.actionType as Hex,
          targetChainId: BigInt(intent.targetChainId as number),
          target: intent.target as Address,
          asset: intent.asset as Address,
          amount: BigInt(intent.amount as string),
        },
        {
          principalHash: complianceContext.principalHash as Hex,
          jurisdictionHash: complianceContext.jurisdictionHash as Hex,
          counterparty: complianceContext.counterparty as Address,
          attestationHashes: complianceContext.attestationHashes as Hex[],
          attestationExpiries: (complianceContext.attestationExpiries as number[]).map(
            BigInt,
          ),
        },
        {
          amountFactor: riskFactors.amountFactor as number,
          assetFactor: riskFactors.assetFactor as number,
          counterpartyFactor: riskFactors.counterpartyFactor as number,
          velocityFactor: riskFactors.velocityFactor as number,
          mandateUsageFactor: riskFactors.mandateUsageFactor as number,
          anomalyFactor: riskFactors.anomalyFactor as number,
        },
        {
          complianceHash: policyFacts.complianceHash as Hex,
          riskHash: policyFacts.riskHash as Hex,
          policyVersionHash: policyFacts.policyVersionHash as Hex,
          mandateScopeHash: policyFacts.mandateScopeHash as Hex,
          timeBucket: BigInt(policyFacts.timeBucket as number),
        },
        payload.ruleCommitmentHashes as Hex[],
        payload.mandateStatusHash as Hex,
        payload.eligibilityResultHash as Hex,
        payload.historicalSummaryHash as Hex,
        payload.externalRiskAttestationHash as Hex,
        BigInt(payload.externalRiskExpiry as number),
        payload.eligibilityAttestationHash as Hex,
        BigInt(payload.eligibilityExpiry as number),
        payload.callData as Hex,
      ],
      account,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return { txHash, blockNumber: receipt.blockNumber.toString(), status: receipt.status, step };
  }
}
