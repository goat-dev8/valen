import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { TeamController } from './team.controller';
import { OrganizationsService } from './organizations.service';
import { TeamService } from './team.service';

@Module({
  controllers: [OrganizationsController, TeamController],
  providers: [OrganizationsService, TeamService],
  exports: [OrganizationsService, TeamService],
})
export class OrganizationsModule {}
