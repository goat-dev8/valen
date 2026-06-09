import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constant';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{
      requestId?: string;
      traceId?: string;
    }>();

    const status = exception.getStatus();
    const body = exception.getResponse();
    const requestId = request.requestId ?? 'unknown';
    const traceId = request.traceId ?? 'unknown';

    let message = exception.message;
    let code: string = ErrorCodes.VALIDATION_ERROR;
    let details: unknown;

    if (typeof body === 'object' && body !== null) {
      const obj = body as Record<string, unknown>;
      if (Array.isArray(obj.message)) {
        message = obj.message.join('; ');
        details = obj.message;
      } else if (typeof obj.message === 'string') {
        message = obj.message;
      }
      code = (obj.code as string) ?? code;
      if (obj.details) details = obj.details;
    }

    if (status === 401) code = ErrorCodes.UNAUTHORIZED;
    if (status === 403) code = ErrorCodes.FORBIDDEN;
    if (status === 404) code = ErrorCodes.NOT_FOUND;
    if (status === 409) code = ErrorCodes.CONFLICT;

    response.status(status).json({ code, message, details, requestId, traceId });
  }
}
