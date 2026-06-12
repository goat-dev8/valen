import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { TeamController } from './team.controller';
import { WalletVerificationsController } from './wallet-verifications.controller';
import { OrganizationsService } from './organizations.service';
import { TeamService } from './team.service';
import { WalletVerificationsService } from './wallet-verifications.service';

@Module({
  controllers: [OrganizationsController, TeamController, WalletVerificationsController],
  providers: [OrganizationsService, TeamService, WalletVerificationsService],
  exports: [OrganizationsService, TeamService, WalletVerificationsService],
})
export class OrganizationsModule {}
