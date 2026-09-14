import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { OrganizationsController } from './organizations.controller.js';

@Module({ imports: [AuthModule], controllers: [OrganizationsController] })
export class OrganizationsModule {}
