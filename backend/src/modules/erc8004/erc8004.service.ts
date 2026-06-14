import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryResultRow } from 'pg';
import { getAddress, Hex, keccak256, parseAbi, stringToHex } from 'viem';
import { AppConfig } from '../../config/config.types';
import { agentKeyFromId } from '../../common/utils/agent-key.util';
import { writeContractWithFreshNonce } from '../../common/utils/chain-write.util';
import { DatabaseService } from '../../database/database.service';
import { AgentsRepository } from '../../database/repositories/agents.repository';
import { AgentWalletsRepository } from '../../database/repositories/agent-wallets.repository';
import { MandatesRepository } from '../../database/repositories/mandates.repository';
import { WalletVerificationsRepository } from '../../database/repositories/wallet-verifications.repository';
import { ChainService } from '../settlement/chain.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';

const RESOLVER_ABI = parseAbi([
  'function bindIdentity(bytes32 agentKey, address registry, uint256 tokenId, address owner, string tokenUri, bytes32 metadataHash, bool registered) external',
]);

type IdentityRow = QueryResultRow & {
  id: string;
  organization_id: string;
  agent_id: string;
  registry_address: string | null;
  resolver_address: string | null;
  token_id: string | null;
  chain_id: number;
  owner_address: string | null;
  token_uri: string | null;
  metadata: Record<string, unknown>;
  status: string;
  metadata_hash: string | null;
  last_synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type AgentIdentityResponse = {
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
    mintTxHash?: string | null;
    mintedAt?: string | null;
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

@Injectable()
export class Erc8004Service {
  constructor(
    private readonly db: DatabaseService,
    private readonly agentsRepository: AgentsRepository,
    private readonly agentWalletsRepository: AgentWalletsRepository,
    private readonly mandatesRepository: MandatesRepository,
    private readonly walletVerificationsRepository: WalletVerificationsRepository,
    private readonly chainService: ChainService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async getIdentity(organizationId: string, agentId: string): Promise<AgentIdentityResponse> {
    const agent = await this.agentsRepository.findByOrgAndId(organizationId, agentId);
    if (!agent) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Agent not found',
      });
    }

    const [identity, wallets, mandates, verifiedWallets] = await Promise.all([
      this.findIdentity(agentId),
      this.agentWalletsRepository.listByAgent(agentId),
      this.mandatesRepository.listByOrganization(organizationId),
      this.walletVerificationsRepository.listByOrganization(organizationId),
    ]);

    const metadata = {
      name: agent.name,
      description: agent.description,
      valenAgentId: agent.id,
      organizationId,
      agentType: agent.agent_type,
      status: agent.status,
      ...(identity?.metadata ?? {}),
    };

    return {
      agentId,
      erc8004: this.toIdentityDto(identity, metadata),
      walletBindings: wallets.map((wallet) => ({
        id: wallet.id,
        chainId: wallet.chain_id,
        walletAddress: wallet.wallet_address,
        walletType: wallet.wallet_type,
        isPrimary: wallet.is_primary,
        status: wallet.status,
      })),
      verifiedWallets: verifiedWallets
        .filter((wallet) => wallet.status === 'verified')
        .map((wallet) => ({
          id: wallet.id,
          chainId: wallet.chain_id,
          walletAddress: wallet.wallet_address,
          status: wallet.status,
          verifiedAt: wallet.verified_at?.toISOString() ?? null,
        })),
      mandates: mandates
        .filter((mandate) => mandate.agent_id === agentId)
        .map((mandate) => ({
          id: mandate.id,
          chainId: mandate.chain_id,
          signerAddress: mandate.signer_address,
          status: mandate.status,
          allowedChains: mandate.allowed_chains ?? [],
          allowedActions: mandate.allowed_actions ?? [],
          allowedAssets: mandate.allowed_assets ?? [],
          allowedTargets: mandate.allowed_targets ?? [],
          typedDataHash: mandate.typed_data_hash,
          validUntil: mandate.valid_until.toISOString(),
        })),
    };
  }

  async ensurePendingIdentity(input: {
    organizationId: string;
    agentId: string;
    resolverAddress?: string | null;
    ownerAddress?: string | null;
    tokenUri?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<AgentIdentityResponse> {
    const agent = await this.agentsRepository.findByOrgAndId(input.organizationId, input.agentId);
    if (!agent) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Agent not found',
      });
    }

    const verifiedWallets = await this.walletVerificationsRepository.listByOrganization(input.organizationId);
    const ownerAddress = input.ownerAddress
      ? getAddress(input.ownerAddress)
      : verifiedWallets.find((w) => w.status === 'verified')?.wallet_address
        ? getAddress(verifiedWallets.find((w) => w.status === 'verified')!.wallet_address)
        : null;

    if (!ownerAddress) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Verify an owner wallet before registering identity',
      });
    }

    const chainId = 421614;
    const resolverAddress =
      input.resolverAddress ??
      this.configService.get('valenIdentityResolverAddress', { infer: true }) ??
      null;

    if (!resolverAddress) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'ValenIdentityResolver is not configured',
      });
    }

    const metadata = {
      name: agent.name,
      description: agent.description,
      valenAgentId: agent.id,
      organizationId: input.organizationId,
      agentType: agent.agent_type,
      status: agent.status,
      ...(input.metadata ?? {}),
    };
    const metadataHash = keccak256(stringToHex(JSON.stringify(metadata)));
    const agentKey = agentKeyFromId(input.agentId);
    const tokenId = BigInt(`0x${agentKey.slice(2, 18)}`);
    const tokenUri = input.tokenUri ?? `https://valen.ai/agents/${agent.public_slug ?? input.agentId}`;
    const registryAddress = getAddress(resolverAddress);

    const walletClient = this.chainService.getWalletClient(chainId);
    const publicClient = this.chainService.getPublicClient(chainId);
    const txHash = await writeContractWithFreshNonce(publicClient, walletClient, {
      address: registryAddress,
      abi: RESOLVER_ABI,
      functionName: 'bindIdentity',
      args: [agentKey, registryAddress, tokenId, ownerAddress, tokenUri, metadataHash, true],
      account: walletClient.account!,
      chain: null,
    });

    const mintedAt = new Date().toISOString();

    await this.db.query(
      `INSERT INTO agent_identity (
         organization_id, agent_id, registry_address, resolver_address, chain_id, token_id, owner_address, token_uri,
         metadata, status, metadata_hash, last_synced_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, 'registered', $10, now())
       ON CONFLICT (agent_id) DO UPDATE SET
         registry_address = EXCLUDED.registry_address,
         resolver_address = EXCLUDED.resolver_address,
         chain_id = EXCLUDED.chain_id,
         token_id = EXCLUDED.token_id,
         owner_address = EXCLUDED.owner_address,
         token_uri = EXCLUDED.token_uri,
         metadata = EXCLUDED.metadata,
         status = 'registered',
         metadata_hash = EXCLUDED.metadata_hash,
         last_synced_at = now(),
         updated_at = now()`,
      [
        input.organizationId,
        input.agentId,
        registryAddress.toLowerCase(),
        registryAddress.toLowerCase(),
        chainId,
        tokenId.toString(),
        ownerAddress.toLowerCase(),
        tokenUri,
        JSON.stringify({ ...metadata, mintTxHash: txHash, mintedAt }),
        metadataHash,
      ],
    );

    return this.getIdentity(input.organizationId, input.agentId);
  }

  private async findIdentity(agentId: string): Promise<IdentityRow | null> {
    const result = await this.db.query<IdentityRow>(
      `SELECT * FROM agent_identity WHERE agent_id = $1 LIMIT 1`,
      [agentId],
    );
    return result.rows[0] ?? null;
  }

  async getPublicProfile(agentSlug: string) {
    const result = await this.db.query<
      QueryResultRow & {
        id: string;
        organization_id: string;
        name: string;
        description: string | null;
        public_slug: string;
        agent_type: string;
        status: string;
      }
    >(
      `SELECT a.* FROM agents a WHERE lower(a.public_slug) = lower($1) LIMIT 1`,
      [agentSlug],
    );
    const agent = result.rows[0];
    if (!agent) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Agent not found',
      });
    }

    const identity = await this.getIdentity(agent.organization_id, agent.id);
    const latestProof = await this.db.query<{ id: string; status: string; created_at: Date }>(
      `SELECT id, status, created_at FROM executions
       WHERE agent_id = $1 AND status = 'executed'
       ORDER BY created_at DESC LIMIT 1`,
      [agent.id],
    );

    return {
      slug: agent.public_slug,
      name: agent.name,
      description: agent.description,
      agentType: agent.agent_type,
      status: agent.status,
      erc8004: identity.erc8004,
      walletBindings: identity.walletBindings.filter((w) => w.isPrimary),
      latestProof: latestProof.rows[0]
        ? {
            executionId: latestProof.rows[0].id,
            href: `/proofs/executions/${latestProof.rows[0].id}`,
            createdAt: latestProof.rows[0].created_at.toISOString(),
          }
        : null,
    };
  }

  private toIdentityDto(
    row: IdentityRow | null,
    fallbackMetadata: Record<string, unknown>,
  ): AgentIdentityResponse['erc8004'] {
    const metadata = row?.metadata ?? fallbackMetadata;
    return {
      status: row?.status ?? 'unregistered',
      registryAddress: row?.registry_address ?? null,
      resolverAddress: row?.resolver_address ?? null,
      tokenId: row?.token_id ?? null,
      chainId: row?.chain_id ?? 421614,
      ownerAddress: row?.owner_address ?? null,
      tokenUri: row?.token_uri ?? null,
      metadata,
      metadataHash: row?.metadata_hash ?? keccak256(stringToHex(JSON.stringify(fallbackMetadata))),
      lastSyncedAt: row?.last_synced_at?.toISOString() ?? null,
      mintTxHash: typeof metadata.mintTxHash === 'string' ? metadata.mintTxHash : null,
      mintedAt: typeof metadata.mintedAt === 'string' ? metadata.mintedAt : row?.last_synced_at?.toISOString() ?? null,
    };
  }
}
