import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { RobinhoodController } from './robinhood.controller';
import { RobinhoodService } from './robinhood.service';

@Module({
  imports: [AssetsModule],
  controllers: [RobinhoodController],
  providers: [RobinhoodService],
  exports: [RobinhoodService],
})
export class RobinhoodModule {}
