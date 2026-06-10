import { Module } from '@nestjs/common';
import { OnChainAttestationService } from './onchain-attestation.service';
import { StylusEngineService } from './stylus-engine.service';
import { MandateChainService } from './mandate-chain.service';
import { SettlementModule } from '../settlement/settlement.module';

@Module({
  imports: [SettlementModule],
  providers: [StylusEngineService, MandateChainService, OnChainAttestationService],
  exports: [OnChainAttestationService, StylusEngineService, MandateChainService],
})
export class StylusModule {}
