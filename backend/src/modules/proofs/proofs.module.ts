import { Module } from '@nestjs/common';
import { ProofsService } from './proofs.service';
import { PublicProofsController } from './public-proofs.controller';

@Module({
  controllers: [PublicProofsController],
  providers: [ProofsService],
  exports: [ProofsService],
})
export class ProofsModule {}
