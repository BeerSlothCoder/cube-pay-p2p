import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CubePayLogger } from '@cubepay/logger';

async function bootstrap() {
  const logger = new CubePayLogger();
  logger.setContext('bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger,
    // Never log request bodies — may contain card data
    bufferLogs: false,
  });

  // ─── Security headers ──────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // ─── Rate limiting ─────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests' },
    }),
  );

  // ─── Global validation pipe (Zod) ─────────────────────────────────────
  app.useGlobalPipes(new ZodValidationPipe());

  // ─── CORS — frontend origin only ──────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5175',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Remove fingerprinting headers ────────────────────────────────────
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // ─── Swagger (dev only) ───────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CubePay API')
      .setDescription('P2P Crypto ARTM Backend — Internal Dev Docs')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on port ${port}`);
}

bootstrap();
