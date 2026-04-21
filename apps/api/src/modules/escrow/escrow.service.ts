import { Injectable, NotFoundException } from '@nestjs/common';
import { EscrowRepository } from './escrow.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_RELEASE_CONFIRMED } from '@cubepay/queue';
import { ReleaseConfirmedJob, ReleaseConfirmedJobSchema } from '@cubepay/queue';
import { CubePayLogger } from '@cubepay/logger';
import { CreateEscrowRecordSchema } from '@cubepay/shared-types';
import { z } from 'zod';

type CreateEscrowDto = z.infer<typeof CreateEscrowRecordSchema>;

@Injectable()
export class EscrowService {
  constructor(
    private readonly repo: EscrowRepository,
    private readonly logger: CubePayLogger,
    @InjectQueue(QUEUE_RELEASE_CONFIRMED) private readonly releaseConfirmedQueue: Queue,
  ) {
    this.logger.setContext('EscrowService');
  }

  async create(dto: CreateEscrowDto) {
    this.logger.audit('escrow.created', { escrowId: dto['escrowId'] });
    return this.repo.create(dto);
  }

  async getStatus(escrowId: string) {
    const escrow = await this.repo.findById(escrowId);
    if (!escrow) throw new NotFoundException('Escrow not found');
    return { escrowId, status: escrow.status, txHash: escrow.tx_hash };
  }

  /**
   * Called when oracle confirms release — updates DB status.
   * This is triggered by consuming QUEUE_RELEASE_CONFIRMED from BullMQ.
   */
  async handleReleaseConfirmed(job: ReleaseConfirmedJob) {
    const parsed = ReleaseConfirmedJobSchema.safeParse(job);
    if (!parsed.success) {
      this.logger.error(`Invalid release confirmed job: ${parsed.error.message}`);
      return;
    }

    await this.repo.updateStatus(parsed.data.escrowId, parsed.data.status, parsed.data.txHash);
    this.logger.audit('escrow.release.confirmed', {
      escrowId: parsed.data.escrowId,
      chain: parsed.data.chain,
      txHash: parsed.data.txHash,
    });
  }
}
