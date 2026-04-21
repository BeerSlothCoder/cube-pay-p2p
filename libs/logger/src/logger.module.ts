import { Module } from '@nestjs/common';
import { CubePayLogger } from './logger.service';

@Module({
  providers: [CubePayLogger],
  exports: [CubePayLogger],
})
export class LoggerModule {}
