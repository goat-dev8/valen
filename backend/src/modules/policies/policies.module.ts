import { Module } from '@nestjs/common';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { PolicyVersionsService } from './policy-versions.service';

@Module({
  controllers: [PoliciesController],
  providers: [PoliciesService, PolicyVersionsService],
  exports: [PoliciesService, PolicyVersionsService],
})
export class PoliciesModule {}
