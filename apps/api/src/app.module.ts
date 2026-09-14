import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { HealthController } from './health.controller.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, OrganizationsModule, CustomersModule],
  controllers: [HealthController],
})
export class AppModule {}
