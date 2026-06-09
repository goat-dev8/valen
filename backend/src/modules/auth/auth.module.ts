import { Module } from '@nestjs/common';
import { AuthController, MeController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrivyService } from './privy.service';

@Module({
  controllers: [AuthController, MeController],
  providers: [AuthService, PrivyService],
  exports: [AuthService, PrivyService],
})
export class AuthModule {}
