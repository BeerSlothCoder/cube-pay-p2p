import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@cubepay/queue';
import { LoggerModule } from '@cubepay/logger';
import { ReleaseEscrowProcessor } from './processors/release-escrow.processor';
import { HsmSignerService } from './signer/hsm-signer.service';
import { BlockchainService } from './blockchain/blockchain.service';
import { oracleConfig, validateOracleConfig } from './config/oracle.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [oracleConfig],
      validate: validateOracleConfig,
    }),
    LoggerModule,
    QueueModule,
  ],
  providers: [
    ReleaseEscrowProcessor,
    HsmSignerService,
    BlockchainService,
  ],
})
export class OracleModule {}
