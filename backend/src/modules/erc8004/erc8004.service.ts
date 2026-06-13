import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { getAddress, keccak256, stringToHex } from 'viem';
import { DatabaseService } from '../../database/database.service';
import { AgentsRepository } from '../../database/repositories/agents.repository';
import { AgentWalletsRepository } from '../../database/repositories/agent-wallets.repository';
import { MandatesRepository } from '../../database/repositories/mandates.repository';
import { WalletVerificationsRepository } from '../../database/repositories/wallet-verifications.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';

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
    const metadata = {
      name: agent.name,
      description: agent.description,
      valenAgentId: agent.id,
      organizationId: input.organizationId,
      agentType: agent.agent_type,
      status: 'registration_pending',
      ...(input.metadata ?? {}),
    };
    const metadataHash = keccak256(stringToHex(JSON.stringify(metadata)));
    const ownerAddress = input.ownerAddress ? getAddress(input.ownerAddress) : null;

    await this.db.query(
      `INSERT INTO agent_identity (
         organization_id, agent_id, resolver_address, chain_id, owner_address, token_uri,
         metadata, status, metadata_hash, last_synced_at
       )
       VALUES ($1, $2, $3, 421614, $4, $5, $6::jsonb, 'registration_pending', $7, now())
       ON CONFLICT (agent_id) DO UPDATE SET
         resolver_address = COALESCE(EXCLUDED.resolver_address, agent_identity.resolver_address),
         owner_address = COALESCE(EXCLUDED.owner_address, agent_identity.owner_address),
         token_uri = COALESCE(EXCLUDED.token_uri, agent_identity.token_uri),
         metadata = EXCLUDED.metadata,
         status = 'registration_pending',
         metadata_hash = EXCLUDED.metadata_hash,
         last_synced_at = now(),
         updated_at = now()`,
      [
        input.organizationId,
        input.agentId,
        input.resolverAddress ?? null,
        ownerAddress?.toLowerCase() ?? null,
        input.tokenUri ?? null,
        JSON.stringify(metadata),
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
    return {
      status: row?.status ?? 'registration_pending',
      registryAddress: row?.registry_address ?? null,
      resolverAddress: row?.resolver_address ?? null,
      tokenId: row?.token_id ?? null,
      chainId: row?.chain_id ?? 421614,
      ownerAddress: row?.owner_address ?? null,
      tokenUri: row?.token_uri ?? null,
      metadata: row?.metadata ?? fallbackMetadata,
      metadataHash: row?.metadata_hash ?? keccak256(stringToHex(JSON.stringify(fallbackMetadata))),
      lastSyncedAt: row?.last_synced_at?.toISOString() ?? null,
    };
  }
}
