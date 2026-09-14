import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { AuthenticatedRequest } from './auth.types.js';

type AccessTokenPayload = { sub: string; activeOrganizationId?: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token =
      typeof authorization === 'string' ? authorization.match(/^Bearer (.+)$/)?.[1] : undefined;

    if (!token) throw new UnauthorizedException('A bearer token is required.');

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      request.auth = { userId: payload.sub, activeOrganizationId: payload.activeOrganizationId };
      return true;
    } catch {
      throw new UnauthorizedException('The access token is invalid or expired.');
    }
  }
}
