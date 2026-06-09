import { BadRequestException, Injectable } from '@nestjs/common';
import { AgentWalletsRepository } from '../../database/repositories/agent-wallets.repository';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { AgentWalletResponseDto, LinkWalletDto } from './dto/agent.dto';

function isEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

@Injectable()
export class AgentWalletsService {
  constructor(
    private readonly agentWalletsRepository: AgentWalletsRepository,
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async linkWallet(
    organizationId: string,
    agentId: string,
    dto: LinkWalletDto,
  ): Promise<AgentWalletResponseDto> {
    if (!isEvmAddress(dto.walletAddress)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid EVM wallet address',
      });
    }

    const chainSupported = await this.organizationsRepository.chainExists(
      dto.chainId,
    );
    if (!chainSupported) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Unsupported chain',
      });
    }

    const wallet = await this.agentWalletsRepository.create({
      organizationId,
      agentId,
      chainId: dto.chainId,
      walletAddress: dto.walletAddress,
      walletType: dto.walletType,
      isPrimary: dto.isPrimary,
    });

    return {
      id: wallet.id,
      chainId: wallet.chain_id,
      walletAddress: wallet.wallet_address,
      walletType: wallet.wallet_type,
      isPrimary: wallet.is_primary,
      status: wallet.status,
    };
  }
}
