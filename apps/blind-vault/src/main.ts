import { NestFactory } from '@nestjs/core';
import { VaultModule } from './vault.module';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { CubePayLogger } from '@cubepay/logger';

async function bootstrap() {
  const logger = new CubePayLogger();
  logger.setContext('blind-vault-bootstrap');

  const app = await NestFactory.create(VaultModule, { logger });

  app.use(helmet());
  app.useGlobalPipes(new ZodValidationPipe());

  // Bind to localhost only — accessed only from apps/api via internal network
  const port = parseInt(process.env.PORT ?? '3004', 10);
  await app.listen(port, '127.0.0.1');
  logger.log(`Blind Vault service running on port ${port} (internal only)`);
}

bootstrap();
