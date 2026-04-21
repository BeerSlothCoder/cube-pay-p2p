import { Module } from '@nestjs/common';
import { JweService } from './jwe.service';

@Module({
  providers: [JweService],
  exports: [JweService],
})
export class CryptoModule {}
