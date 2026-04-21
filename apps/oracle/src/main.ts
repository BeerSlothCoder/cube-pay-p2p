import { NestFactory } from '@nestjs/core';
import { OracleModule } from './oracle.module';
import { CubePayLogger } from '@cubepay/logger';

async function bootstrap() {
  const logger = new CubePayLogger();
  logger.setContext('oracle-bootstrap');

  const app = await NestFactory.createMicroservice(OracleModule, {
    logger,
    // Oracle does NOT open an HTTP port.
    // It operates entirely via BullMQ queue consumption.
  });

  await app.listen();
  logger.log('Oracle service started — listening on queue only (no HTTP port)');
}

bootstrap();
