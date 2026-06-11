import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from '../../database/repositories/users.repository';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { TeamMembersRepository } from '../../database/repositories/team-members.repository';
import { PrivyService } from './privy.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthSyncDto } from './dto/auth-sync.dto';

const DEFAULT_ORG_CHAIN_ID = 421614;

export interface AuthProfileResponse {
  user: {
    id: string;
    privyUserId: string;
    email: string | null;
    displayName: string | null;
    status: string;
  };
  organizations: Array<{
    id: string;
    role: string;
    status: string;
  }>;
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly privyService: PrivyService,
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly teamMembersRepository: TeamMembersRepository,
  ) {}

  async sync(
    token: string,
    dto: AuthSyncDto,
  ): Promise<AuthProfileResponse> {
    const claims = await this.privyService.verifyToken(token).catch(() => {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Invalid token',
      });
    });

    if (claims.userId !== dto.privyUserId) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Token subject must match privyUserId',
      });
    }

    const userRow = await this.usersRepository.upsertFromPrivy({
      privyUserId: dto.privyUserId,
      email: dto.email,
      displayName: dto.email?.split('@')[0] ?? null,
    });

    let memberships = await this.usersRepository.getMemberships(userRow.id);
    if (memberships.length === 0) {
      await this.provisionDefaultOrganization(userRow.id, dto.email);
      memberships = await this.usersRepository.getMemberships(userRow.id);
    }

    const isPlatformAdmin = await this.usersRepository.isPlatformAdmin(userRow.id);
    const user = this.usersRepository.toAuthenticatedUser(
      userRow,
      memberships,
      isPlatformAdmin,
    );

    return this.buildProfile(user);
  }

  async getMe(user: AuthenticatedUser): Promise<AuthProfileResponse> {
    return this.buildProfile(user);
  }

  private async provisionDefaultOrganization(
    userId: string,
    email?: string | null,
  ): Promise<void> {
    const base =
      (email?.split('@')[0] ?? `workspace-${userId.slice(0, 8)}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'workspace';

    let slug = base;
    let attempt = 0;
    while (await this.organizationsRepository.findBySlug(slug)) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }

    const org = await this.organizationsRepository.create({
      name: email?.split('@')[0] ?? 'My Organization',
      slug,
      defaultChainId: DEFAULT_ORG_CHAIN_ID,
    });

    await this.teamMembersRepository.addOwnerMembership(org.id, userId);
  }

  private buildProfile(user: AuthenticatedUser): AuthProfileResponse {
    const permissions = new Set<string>();
    if (user.isPlatformAdmin) permissions.add('platform_admin');
    for (const m of user.memberships) {
      permissions.add(m.role);
    }

    return {
      user: {
        id: user.id,
        privyUserId: user.privyUserId,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
      },
      organizations: user.memberships.map((m) => ({
        id: m.organizationId,
        role: m.role,
        status: m.status,
      })),
      permissions: Array.from(permissions),
    };
  }
}
