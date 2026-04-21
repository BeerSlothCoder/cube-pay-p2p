import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QUEUE_ESCROW_RELEASE,
  QUEUE_RELEASE_CONFIRMED,
  EscrowReleaseJobSchema,
  EscrowReleaseJob,
  ReleaseConfirmedJob,
} from '@cubepay/queue';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BlockchainService } from '../blockchain/blockchain.service';
import { HsmSignerService } from '../signer/hsm-signer.service';
import { CubePayLogger } from '@cubepay/logger';

/**
 * ReleaseEscrowProcessor
 *
 * Consumes QUEUE_ESCROW_RELEASE jobs published by apps/payment.
 * Signs the release, submits on-chain, then publishes to QUEUE_RELEASE_CONFIRMED.
 *
 * This processor has ZERO inbound HTTP.
 * The only way to trigger it is via a validated BullMQ job.
 */
@Processor(QUEUE_ESCROW_RELEASE, {
  concurrency: 5,
  limiter: { max: 10, duration: 1000 }, // max 10 releases/sec
})
export class ReleaseEscrowProcessor extends WorkerHost {
  constructor(
    private readonly signer: HsmSignerService,
    private readonly blockchain: BlockchainService,
    private readonly logger: CubePayLogger,
    @InjectQueue(QUEUE_RELEASE_CONFIRMED) private readonly confirmQueue: Queue,
  ) {
    super();
    this.logger.setContext('ReleaseEscrowProcessor');
  }

  async process(job: Job<EscrowReleaseJob>): Promise<void> {
    // 1. Parse and validate job payload — reject bad jobs immediately
    const parsed = EscrowReleaseJobSchema.safeParse(job.data);
    if (!parsed.success) {
      this.logger.error(`Invalid job payload: ${parsed.error.message}`, job.id);
      throw new Error('INVALID_JOB_PAYLOAD'); // BullMQ will NOT retry on schema errors
    }

    const { escrowId, buyerWallet, chain, contractAddress, nonce, encryptedBlob, sellerWallet } =
      parsed.data;

    this.logger.audit('oracle.release.started', { escrowId, chain, nonce });

    // 2. Sign the release message using HSM (or dev key in local mode)
    const signature = await this.signer.signEscrowRelease(escrowId, buyerWallet, nonce);

    // 3. Submit the signed release to the blockchain
    const txHash = await this.blockchain.submitRelease({
      chain,
      contractAddress,
      escrowId,
      buyerWallet,
      nonce,
      signature,
    });

    this.logger.audit('oracle.release.submitted', { escrowId, chain, txHash });

    // 4. Publish confirmation for apps/api status update and apps/blind-vault storage
    const confirmJob: ReleaseConfirmedJob = {
      escrowId,
      chain,
      txHash,
      buyerWallet,
      sellerWallet,
      contractAddress,
      status: 'COMPLETED',
      encryptedBlob,
      encryptedTravelRuleBlob: parsed.data.encryptedTravelRuleBlob,
      confirmedAt: Date.now(),
    };

    await this.confirmQueue.add('release-confirmed', confirmJob, {
      jobId: `confirmed-${escrowId}`, // Idempotent — dedup by escrowId
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.security('oracle.release.failed', {
      jobId: job.id,
      escrowId: job.data?.escrowId,
      error: error.message,
      attempts: job.attemptsMade,
    });
  }
}
