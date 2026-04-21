import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_RELEASE_CONFIRMED, ReleaseConfirmedJobSchema, ReleaseConfirmedJob } from '@cubepay/queue';
import { VaultService } from '../services/vault.service';
import { CubePayLogger } from '@cubepay/logger';

/**
 * VaultQueueConsumer
 *
 * Consumes QUEUE_RELEASE_CONFIRMED jobs published by apps/oracle.
 * Stores the encrypted blob in the Blind Vault DB automatically.
 *
 * This means apps/oracle doesn't need to know about the vault's HTTP address —
 * communication is purely through the shared queue.
 */
@Processor(QUEUE_RELEASE_CONFIRMED)
export class VaultQueueConsumer extends WorkerHost {
  constructor(
    private readonly vaultService: VaultService,
    private readonly logger: CubePayLogger,
  ) {
    super();
    this.logger.setContext('VaultQueueConsumer');
  }

  async process(job: Job<ReleaseConfirmedJob>): Promise<void> {
    const parsed = ReleaseConfirmedJobSchema.safeParse(job.data);
    if (!parsed.success) {
      this.logger.error(`Invalid vault job: ${parsed.error.message}`);
      throw new Error('INVALID_VAULT_JOB');
    }

    const data = parsed.data;

    await this.vaultService.store({
      escrowId: data.escrowId,
      chainId: data.chain,
      txHash: data.txHash,
      escrowAddress: data.contractAddress,
      buyerWallet: data.buyerWallet,
      sellerWallet: data.sellerWallet,
      encryptedBlob: data.encryptedBlob,
      encryptedTravelRuleBlob: data.encryptedTravelRuleBlob,
      status: data.status,
    });
  }
}
