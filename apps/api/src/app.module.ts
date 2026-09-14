import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthController } from './health.controller.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, OrganizationsModule],
  controllers: [HealthController],
})
export class AppModule {}
