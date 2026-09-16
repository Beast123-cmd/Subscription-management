import { Body, Controller, Get, Post, UseGuards, BadRequestException, Inject } from '@nestjs/common';
import { z } from 'zod';

import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(256) });
const activationSchema = z.object({ token: z.string().min(32).max(256), password: z.string().min(12).max(256) });

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.auth.login(parsed.data.email, parsed.data.password);
  }

  @Post('activate')
  async activate(@Body() body: unknown) {
    const parsed = activationSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.auth.acceptInvitation(parsed.data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() currentUser: { userId: string }) {
    return this.auth.getCurrentUser(currentUser.userId);
  }
}
