import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@cubepay/logger';
import { HsmMockController } from './hsm-mock.controller';
import { HsmMockService } from './hsm-mock.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
  ],
  controllers: [HsmMockController],
  providers: [HsmMockService],
})
export class HsmMockModule {}
