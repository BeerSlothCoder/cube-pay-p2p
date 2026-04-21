import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@cubepay/queue';
import { CryptoModule } from '@cubepay/crypto';
import { AuthModule } from '@cubepay/auth';
import { LoggerModule } from '@cubepay/logger';
import { VaultController } from './controllers/vault.controller';
import { VaultService } from './services/vault.service';
import { VaultRepository } from './services/vault.repository';
import { NoPlaintextGuard } from './guards/no-plaintext.guard';
import { VaultQueueConsumer } from './processors/vault-queue.consumer';
import { VaultDatabaseModule } from './config/vault-database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    AuthModule,
    CryptoModule,
    QueueModule,
    VaultDatabaseModule,
  ],
  controllers: [VaultController],
  providers: [VaultService, VaultRepository, NoPlaintextGuard, VaultQueueConsumer],
})
export class VaultModule {}
