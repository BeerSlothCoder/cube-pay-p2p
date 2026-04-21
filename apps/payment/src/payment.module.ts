import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@cubepay/queue';
import { LoggerModule } from '@cubepay/logger';
import { RevolutWebhookController } from './controllers/revolut-webhook.controller';
import { WebhookVerifierService } from './services/webhook-verifier.service';
import { IdempotencyService } from './services/idempotency.service';
import { PaymentQueueService } from './services/payment-queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    QueueModule,
  ],
  controllers: [RevolutWebhookController],
  providers: [WebhookVerifierService, IdempotencyService, PaymentQueueService],
})
export class PaymentModule {}
