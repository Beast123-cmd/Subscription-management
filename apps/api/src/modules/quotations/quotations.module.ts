import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { QuotationsController } from './quotations.controller.js';
import { QuotationsService } from './quotations.service.js';
@Module({
  imports: [AuthModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
