import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  privyUserId!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  displayName!: string | null;

  @ApiProperty()
  status!: string;
}

export class OrganizationMembershipDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  status!: string;
}

export class MeResponseDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto;

  @ApiProperty({ type: [OrganizationMembershipDto] })
  organizations!: OrganizationMembershipDto[];

  @ApiProperty({ type: [String] })
  permissions!: string[];
}
