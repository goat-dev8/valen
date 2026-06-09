import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const REQUEST_ID_HEADER = 'x-request-id';
export const TRACE_ID_HEADER = 'x-trace-id';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Record<string, unknown>>();
    const response = http.getResponse<{ setHeader: (k: string, v: string) => void }>();

    const requestId =
      (request.headers as Record<string, string | undefined>)?.[
        REQUEST_ID_HEADER
      ] ?? randomUUID();
    const traceId =
      (request.headers as Record<string, string | undefined>)?.[
        TRACE_ID_HEADER
      ] ?? randomUUID();

    request['requestId'] = requestId;
    request['traceId'] = traceId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.setHeader(TRACE_ID_HEADER, traceId);

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return { ...data, requestId, traceId };
        }
        return { data, requestId, traceId };
      }),
    );
  }
}
