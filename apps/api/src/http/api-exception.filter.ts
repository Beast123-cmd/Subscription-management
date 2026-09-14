import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type HttpResponse = { status(code: number): { json(body: unknown): void } };
type HttpRequest = { url: string };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const request = host.switchToHttp().getRequest<HttpRequest>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp ? exception.getResponse() : undefined;
    const raw = typeof payload === 'string' ? { message: payload } : payload ?? {};
    const message = typeof raw === 'object' && raw !== null && 'message' in raw
      ? raw.message
      : 'Internal server error';

    response.status(status).json({
      error: {
        code: status >= 500 ? 'INTERNAL_ERROR' : `HTTP_${status}`,
        message: Array.isArray(message) ? 'Request validation failed.' : message,
        ...(Array.isArray(message) ? { details: message } : {}),
      },
      statusCode: status,
      path: request.url,
    });
  }
}
