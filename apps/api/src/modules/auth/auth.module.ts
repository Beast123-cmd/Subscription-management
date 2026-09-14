import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { TenantGuard } from './tenant.guard.js';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET must be configured before starting the API.');

@Module({
  imports: [
    JwtModule.register({ global: true, secret: jwtSecret, signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, TenantGuard],
  exports: [AuthService, JwtAuthGuard, TenantGuard],
})
export class AuthModule {}
