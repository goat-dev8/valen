import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TeamMembersRepository } from '../../database/repositories/team-members.repository';
import { UsersRepository } from '../../database/repositories/users.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import { paginate } from '../../common/interfaces/paginated-result.interface';
import {
  InviteMemberDto,
  TeamMemberResponseDto,
  UpdateTeamMemberDto,
} from './dto/team.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class TeamService {
  constructor(
    private readonly teamMembersRepository: TeamMembersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async list(organizationId: string, page: number, limit: number) {
    const { items, total } = await this.teamMembersRepository.listByOrganization(
      organizationId,
      page,
      limit,
    );
    return paginate(items.map((m) => this.toDto(m)), total, page, limit);
  }

  async invite(
    organizationId: string,
    dto: InviteMemberDto,
    user: AuthenticatedUser,
  ): Promise<TeamMemberResponseDto> {
    if (['platform_admin', 'service_account', 'agent'].includes(dto.role)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid organization role',
      });
    }

    let invitee = await this.usersRepository.findByEmail(dto.email);
    if (!invitee) {
      invitee = await this.usersRepository.upsertFromPrivy({
        privyUserId: `pending:${dto.email}`,
        email: dto.email,
      });
    }

    const existing = await this.teamMembersRepository.findByOrgAndUser(
      organizationId,
      invitee.id,
    );
    if (existing && existing.status !== 'removed') {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'User is already a team member',
      });
    }

    const member = await this.teamMembersRepository.createInvitation({
      organizationId,
      userId: invitee.id,
      role: dto.role,
      invitedByUserId: user.id,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'team.invited',
      entityType: 'team_member',
      entityId: member.id,
      eventHash: hashPayload({ memberId: member.id }),
    });

    return this.toDto({ ...member, email: dto.email });
  }

  async updateMember(
    organizationId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
    user: AuthenticatedUser,
  ): Promise<TeamMemberResponseDto> {
    const member = await this.teamMembersRepository.findById(memberId);
    if (!member || member.organization_id !== organizationId) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Team member not found',
      });
    }

    if (
      member.role === 'organization_owner' &&
      dto.status === 'removed'
    ) {
      const owners = await this.teamMembersRepository.countOwners(organizationId);
      if (owners <= 1) {
        throw new BadRequestException({
          code: ErrorCodes.DOMAIN_REJECTED,
          message: 'Cannot remove the last organization owner',
        });
      }
    }

    const updated = await this.teamMembersRepository.update(memberId, {
      role: dto.role,
      status: dto.status,
    });

    if (!updated) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Team member not found',
      });
    }

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'team.updated',
      entityType: 'team_member',
      entityId: memberId,
      eventHash: hashPayload({ memberId, dto }),
    });

    return this.toDto(updated);
  }

  private toDto(member: {
    id: string;
    user_id: string;
    email?: string | null;
    display_name?: string | null;
    role: string;
    status: string;
    joined_at: Date | null;
    created_at: Date;
  }): TeamMemberResponseDto {
    return {
      id: member.id,
      userId: member.user_id,
      email: member.email ?? null,
      displayName: member.display_name ?? null,
      role: member.role,
      status: member.status,
      joinedAt: member.joined_at?.toISOString() ?? null,
      createdAt: member.created_at.toISOString(),
    };
  }
}
