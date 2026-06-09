import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { PLATFORM_ROLES, PlatformRole } from '../../../common/constants/roles.constant';

const ORG_ROLES = PLATFORM_ROLES.filter(
  (r) => !['platform_admin', 'service_account', 'agent'].includes(r),
);

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ORG_ROLES })
  @IsIn(ORG_ROLES)
  role!: PlatformRole;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ enum: ORG_ROLES })
  @IsOptional()
  @IsIn(ORG_ROLES)
  role?: PlatformRole;

  @ApiPropertyOptional({ enum: ['invited', 'active', 'suspended', 'removed'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class TeamMemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  displayName!: string | null;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  joinedAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}
