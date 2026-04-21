import { Injectable } from '@nestjs/common';
import { VaultRepository } from './vault.repository';
import { StoreVaultRecordSchema } from '@cubepay/shared-types';
import { z } from 'zod';
import { CubePayLogger } from '@cubepay/logger';

type StoreDto = z.infer<typeof StoreVaultRecordSchema>;

@Injectable()
export class VaultService {
  constructor(
    private readonly repo: VaultRepository,
    private readonly logger: CubePayLogger,
  ) {
    this.logger.setContext('VaultService');
  }

  async store(dto: StoreDto) {
    const record = await this.repo.insert(dto);

    this.logger.audit('vault.record.stored', {
      escrowId: dto.escrowId,
      chain: dto.chainId,
      // No amounts, no names — only public blockchain data in audit log
      txHash: dto.txHash,
      buyerWallet: dto.buyerWallet,
    });

    return { id: record.id, stored: true };
  }

  async exportForAuthority(query: { walletAddress: string; fromDate?: string; toDate?: string }) {
    // Export encrypted blobs matching wallet address for regulatory request.
    // Returns ONLY ciphertext — no decryption.
    const records = await this.repo.findByWallet(
      query.walletAddress,
      query.fromDate,
      query.toDate,
    );

    this.logger.audit('vault.export.requested', {
      walletAddress: query.walletAddress,
      recordCount: records.length,
      // Regulatory export is always audited
    });

    return records;
  }
}
