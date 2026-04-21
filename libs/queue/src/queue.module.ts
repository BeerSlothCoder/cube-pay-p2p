import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  QUEUE_ESCROW_RELEASE,
  QUEUE_RELEASE_CONFIRMED,
  QUEUE_KYC_RESULT,
  QUEUE_PRICE_REFRESH,
  QUEUE_VAULT_STORE,
} from './queues';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          password: process.env.REDIS_PASSWORD,
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000, age: 86400 },
          removeOnFail: { count: 500, age: 604800 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_ESCROW_RELEASE },
      { name: QUEUE_RELEASE_CONFIRMED },
      { name: QUEUE_KYC_RESULT },
      { name: QUEUE_PRICE_REFRESH },
      { name: QUEUE_VAULT_STORE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
