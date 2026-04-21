import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import { CubePayLogger } from '@cubepay/logger';

async function bootstrap() {
  const logger = new CubePayLogger();
  logger.setContext('payment-bootstrap');

  const app = await NestFactory.create(PaymentModule, { logger });

  // Payment service is internal-only — not exposed to public internet directly.
  // It sits behind the firewall and only accepts Revolut webhook calls
  // forwarded from the API gateway / Cloudflare.

  app.use(helmet());
  app.useGlobalPipes(new ZodValidationPipe());

  // Bind to localhost only — accessed via internal network
  const port = parseInt(process.env.PORT ?? '3003', 10);
  await app.listen(port, '127.0.0.1');
  logger.log(`Payment service running on port ${port} (internal only)`);
}

bootstrap();
