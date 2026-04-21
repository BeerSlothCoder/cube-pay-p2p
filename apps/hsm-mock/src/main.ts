import { NestFactory } from '@nestjs/core';
import { HsmMockModule } from './hsm-mock.module';
import { CubePayLogger } from '@cubepay/logger';

async function bootstrap() {
  const logger = new CubePayLogger();
  logger.setContext('hsm-mock-bootstrap');

  const app = await NestFactory.create(HsmMockModule, { logger });

  const port = parseInt(process.env.PORT ?? '3005', 10);
  await app.listen(port, '127.0.0.1');
  logger.warn(`HSM Mock running on port ${port} — DEVELOPMENT ONLY`);
}

bootstrap();
