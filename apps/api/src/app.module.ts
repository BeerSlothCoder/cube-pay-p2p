import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@cubepay/auth';
import { QueueModule } from '@cubepay/queue';
import { CryptoModule } from '@cubepay/crypto';
import { LoggerModule } from '@cubepay/logger';
import { TerminalsModule } from './modules/terminals/terminals.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { UsersModule } from './modules/users/users.module';
import { KycModule } from './modules/kyc/kyc.module';
import { PricesModule } from './modules/prices/prices.module';
import { AuthAppModule } from './modules/auth/auth.module';
import { DatabaseModule } from './config/database.module';
import { appConfig, validateConfig } from './config/app.config';

@Module({
  imports: [
    // ─── Config (validated at startup) ───────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
      expandVariables: true,
    }),

    // ─── Shared libs ─────────────────────────────────────────────────────
    LoggerModule,
    AuthModule,
    QueueModule,
    CryptoModule,
    DatabaseModule,

    // ─── Feature modules ──────────────────────────────────────────────────
    AuthAppModule,
    UsersModule,
    KycModule,
    TerminalsModule,
    EscrowModule,
    PricesModule,
  ],
})
export class AppModule {}
