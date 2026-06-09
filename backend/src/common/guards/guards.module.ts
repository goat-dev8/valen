import { Global, Module } from '@nestjs/common';
import { PrivyAuthGuard } from './privy-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { JwtOrApiKeyGuard } from './jwt-or-api-key.guard';
import { RolesGuard } from './roles.guard';
import { OrganizationScopeGuard } from './organization-scope.guard';

@Global()
@Module({
  providers: [
    PrivyAuthGuard,
    ApiKeyAuthGuard,
    JwtOrApiKeyGuard,
    RolesGuard,
    OrganizationScopeGuard,
  ],
  exports: [
    PrivyAuthGuard,
    ApiKeyAuthGuard,
    JwtOrApiKeyGuard,
    RolesGuard,
    OrganizationScopeGuard,
  ],
})
export class GuardsModule {}
