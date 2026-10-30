import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix: /api/v1 (RESTful API versioning standard)
  app.setGlobalPrefix('api/v1');

  // Parse HTTP-only cookies for JWT session management
  app.use(cookieParser());

  // Input validation & transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS configuration: strictly allow configured frontend origins
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOriginsSet = new Set(configuredOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin server requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check configured exact origins
      if (allowedOriginsSet.has(origin)) {
        return callback(null, true);
      }

      // In local development only, allow explicit localhost/127.0.0.1 or LAN IPs
      if (!isProduction) {
        try {
          const parsed = new URL(origin);
          const hostname = parsed.hostname;
          if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
          ) {
            return callback(null, true);
          }
        } catch {
          // Fall through to reject
        }
      }

      return callback(new Error('Request blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Revora Backend server running on: http://localhost:${port}/api/v1`);
}

bootstrap();
