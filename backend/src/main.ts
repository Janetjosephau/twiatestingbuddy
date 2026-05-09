import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix for all routes
  app.setGlobalPrefix('api', { exclude: ['/'] });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Testing Buddy AI Backend running on: http://0.0.0.0:${port}/api`);
  console.log(`📚 API Documentation: http://0.0.0.0:${port}/api/docs`);
}

bootstrap();