import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_ESCROW_RELEASE, EscrowReleaseJob } from '@cubepay/queue';
import { CubePayLogger } from '@cubepay/logger';

@Injectable()
export class PaymentQueueService {
  constructor(
    @InjectQueue(QUEUE_ESCROW_RELEASE) private readonly releaseQueue: Queue,
    private readonly logger: CubePayLogger,
  ) {
    this.logger.setContext('PaymentQueueService');
  }

  async enqueueEscrowRelease(data: Omit<EscrowReleaseJob, never>): Promise<void> {
    await this.releaseQueue.add('release-escrow', data, {
      // Deduplicate by escrowId — prevents double-spend even if queue is retried
      jobId: `release-${data.escrowId}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
    });

    this.logger.log(`Escrow release enqueued: ${data.escrowId}`);
  }
}
