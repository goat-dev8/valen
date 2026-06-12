import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveDeploymentRoot } from '../../common/utils/deployment-path.util';
import {
  Address,
  Hex,
  WalletClient,
  decodeEventLog,
  getAddress,
  parseAbi,
} from 'viem';
import { ChainService } from '../settlement/chain.service';
import {
  ACTION_TYPE_TRANSFER,
  ARBITRUM_SEPOLIA_E2E_MANDATE_ID,
  DEFAULT_E2E_ASSET,
  DEFAULT_SETTLEMENT_AMOUNT_WEI,
  MANDATE_SCOPE_HASH,
} from '../../common/constants/onchain.constants';
import { writeContractWithFreshNonce } from '../../common/utils/chain-write.util';

const mandateRegistryAbi = parseAbi([
  'function checkMandate(bytes32 mandateId, address agent, address asset, uint256 amount, bytes32 actionHash) view returns (bool)',
  'function getMandate(bytes32 mandateId) view returns (bytes32 mandateId, address principal, address agent, bytes32 scopeHash, uint64 validFrom, uint64 validUntil, uint256 maxPerTx, uint256 maxTotal, uint256 usedTotal, uint8 status, uint16 reasonCode)',
  'function allowScope(bytes32 scopeHash)',
  'function allowScopeBinding(bytes32 scopeHash, address asset, bytes32 actionType)',
  'function grantMandate(address principal, address agent, bytes32 scopeHash, uint64 validFrom, uint64 validUntil, uint256 maxPerTx, uint256 maxTotal) returns (bytes32 mandateId)',
  'function activateMandate(bytes32 mandateId)',
  'event MandateGranted(bytes32 indexed mandateId, address indexed principal, address indexed agent, bytes32 scopeHash, uint64 validFrom, uint64 validUntil, uint256 maxPerTx, uint256 maxTotal)',
]);

const KNOWN_MANDATE_IDS: Partial<Record<number, Hex[]>> = {
  421614: [ARBITRUM_SEPOLIA_E2E_MANDATE_ID],
};

@Injectable()
export class MandateChainService {
  private readonly repoRoot: string;

  constructor(private readonly chainService: ChainService) {
    this.repoRoot = resolveDeploymentRoot();
  }

  private loadMandateRegistryAddress(chainId: number): Address {
    const chainName =
      chainId === 421614
        ? 'arbitrum-sepolia'
        : chainId === 46630
          ? 'robinhood-testnet'
          : null;
    if (!chainName) throw new Error(`Unsupported chain ID: ${chainId}`);
    const path = join(
      this.repoRoot,
      'contracts',
      'deployments',
      chainName,
      'deployment.json',
    );
    if (!existsSync(path)) {
      throw new Error(`Deployment file missing: ${path}`);
    }
    const deployment = JSON.parse(readFileSync(path, 'utf8')) as {
      contracts: { ValenMandateRegistry: { address: string } };
    };
    return deployment.contracts.ValenMandateRegistry.address as Address;
  }

  async ensureActiveMandate(
    chainId: number,
    agent: Address,
    asset: Address = DEFAULT_E2E_ASSET,
    amount: bigint = DEFAULT_SETTLEMENT_AMOUNT_WEI,
  ): Promise<Hex> {
    const agentAddress = getAddress(agent.toLowerCase() as Address);
    const assetAddress = getAddress(asset.toLowerCase() as Address);
    const registryAddress = this.loadMandateRegistryAddress(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const walletClient = this.chainService.getWalletClient(chainId);
    const account = walletClient.account;
    if (!account) throw new Error('Settlement wallet not configured');

    for (const mandateId of KNOWN_MANDATE_IDS[chainId] ?? []) {
      if (
        await this.isMandateUsable(
          chainId,
          registryAddress,
          mandateId,
          agentAddress,
          assetAddress,
          amount,
        )
      ) {
        return mandateId;
      }
    }

    await this.writeMandateTx(
      chainId,
      walletClient,
      registryAddress,
      account,
      'allowScope',
      [MANDATE_SCOPE_HASH],
    );
    await this.writeMandateTx(
      chainId,
      walletClient,
      registryAddress,
      account,
      'allowScopeBinding',
      [MANDATE_SCOPE_HASH, assetAddress, ACTION_TYPE_TRANSFER],
    );

    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const now = BigInt(block.timestamp);
    const grantTxHash = await writeContractWithFreshNonce(
      publicClient,
      walletClient,
      {
        address: registryAddress,
        abi: mandateRegistryAbi,
        functionName: 'grantMandate',
        args: [
          agentAddress,
          agentAddress,
          MANDATE_SCOPE_HASH,
          now,
          now + 86400n,
          amount * 1000n,
          amount * 10000n,
        ],
        account,
        chain: null,
      },
    );
    const grantReceipt = await publicClient.waitForTransactionReceipt({
      hash: grantTxHash,
    });
    if (grantReceipt.status !== 'success') {
      throw new Error(`grantMandate reverted: ${grantTxHash}`);
    }

    let mandateId: Hex | null = null;
    for (const log of grantReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: mandateRegistryAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'MandateGranted') {
          mandateId = decoded.args.mandateId as Hex;
          break;
        }
      } catch {
        // unrelated log
      }
    }
    if (!mandateId) {
      throw new Error(`MandateGranted event missing in tx ${grantTxHash}`);
    }

    await this.writeMandateTx(
      chainId,
      walletClient,
      registryAddress,
      account,
      'activateMandate',
      [mandateId],
    );

    if (
      !(await this.isMandateUsable(
        chainId,
        registryAddress,
        mandateId,
        agentAddress,
        assetAddress,
        amount,
      ))
    ) {
      throw new Error(`Mandate ${mandateId} not usable after activation`);
    }

    return mandateId;
  }

  private async isMandateUsable(
    chainId: number,
    registryAddress: Address,
    mandateId: Hex,
    agent: Address,
    asset: Address,
    amount: bigint,
  ): Promise<boolean> {
    const publicClient = this.chainService.getPublicClient(chainId);
    try {
      return await publicClient.readContract({
        address: registryAddress,
        abi: mandateRegistryAbi,
        functionName: 'checkMandate',
        args: [mandateId, agent, asset, amount, ACTION_TYPE_TRANSFER],
      });
    } catch {
      return false;
    }
  }

  private async writeMandateTx(
    chainId: number,
    walletClient: WalletClient,
    address: Address,
    account: NonNullable<WalletClient['account']>,
    functionName: 'allowScope' | 'allowScopeBinding' | 'activateMandate',
    args: readonly unknown[],
  ): Promise<void> {
    const publicClient = this.chainService.getPublicClient(chainId);
    try {
      const txHash = await writeContractWithFreshNonce(publicClient, walletClient, {
        address,
        abi: mandateRegistryAbi,
        functionName,
        args: args as never,
        account,
        chain: null,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') {
        throw new Error(`${functionName} reverted: ${txHash}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Already') || message.includes('exists')) {
        return;
      }
      throw error;
    }
  }
}
