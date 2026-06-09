import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      body?: { idempotencyKey?: string };
    }>();
    return (
      request.headers['idempotency-key'] ??
      request.headers['x-idempotency-key'] ??
      request.body?.idempotencyKey
    );
  },
);
