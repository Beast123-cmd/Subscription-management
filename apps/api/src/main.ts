import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' });
  app.setGlobalPrefix('api', { exclude: ['health'] });
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
