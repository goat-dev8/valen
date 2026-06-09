import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/config.types';

type PrivyAuthClient = {
  verifyAuthToken(token: string): Promise<{ userId: string }>;
};

@Injectable()
export class PrivyService {
  private client: PrivyAuthClient | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async verifyToken(token: string) {
    return (await this.getClient()).verifyAuthToken(token);
  }

  private async getClient(): Promise<PrivyAuthClient> {
    if (!this.client) {
      const { PrivyClient } = await import('@privy-io/server-auth');
      this.client = new PrivyClient(
        this.configService.get('privyAppId', { infer: true }),
        this.configService.get('privyAppSecret', { infer: true }),
      );
    }

    return this.client;
  }
}
