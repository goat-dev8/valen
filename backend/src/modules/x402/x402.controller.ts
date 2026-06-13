import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-api-key.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { X402Service } from './x402.service';

@ApiTags('x402')
@Controller('v1/organizations/:organizationId/x402')
@UseGuards(JwtOrApiKeyGuard, OrganizationScopeGuard)
@ApiBearerAuth()
export class X402Controller {
  constructor(private readonly x402Service: X402Service) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate x402 USDC payment with mandate and budget checks' })
  initiate(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body()
    body: {
      agentId: string;
      mandateId: string;
      merchantUrl?: string;
      recipient: string;
      amount: string;
      chainId?: number;
    },
  ) {
    return this.x402Service.initiate({
      organizationId,
      agentId: body.agentId,
      mandateId: body.mandateId,
      merchantUrl: body.merchantUrl,
      recipient: body.recipient,
      amount: body.amount,
      chainId: body.chainId,
    });
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute an approved x402 payment intent' })
  execute(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() body: { paymentIntentId: string },
  ) {
    return this.x402Service.execute(organizationId, body.paymentIntentId);
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get x402 payment by id' })
  getPayment(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.x402Service.getPayment(organizationId, paymentId);
  }
}

@ApiTags('public-x402')
@Controller('v1/public/payments')
export class PublicPaymentsController {
  constructor(private readonly x402Service: X402Service) {}

  @Get(':paymentId')
  @ApiOperation({ summary: 'Public payment proof (no auth)' })
  getPublic(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    return this.x402Service.getPublicPayment(paymentId);
  }
}
