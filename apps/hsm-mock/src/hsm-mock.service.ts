import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { CubePayLogger } from '@cubepay/logger';

/**
 * HsmMockService
 *
 * Dev-only software simulation of CloudHSM signing operations.
 * Uses the same ethers.js signing logic as the real HSM would produce.
 */
@Injectable()
export class HsmMockService {
  constructor(private readonly logger: CubePayLogger) {
    this.logger.setContext('HsmMockService');
    this.logger.warn('HSM Mock active — replace with real CloudHSM in production');
  }

  async sign(escrowId: string, buyerWallet: string, nonce: number) {
    const privateKey = process.env.ORACLE_PRIVATE_KEY;
    if (!privateKey) throw new Error('ORACLE_PRIVATE_KEY not set for HSM mock');

    const wallet = new ethers.Wallet(privateKey);
    const msgHash = ethers.utils.solidityKeccak256(
      ['bytes32', 'address', 'uint256'],
      [ethers.utils.formatBytes32String(escrowId), buyerWallet, nonce],
    );
    const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));

    return { signature, signer: wallet.address };
  }

  async releaseShardForCourtOrder(dto: {
    courtOrderId: string;
    signedByJudge: string;
    requestedWallets: string[];
  }) {
    // In production: HSM validates court order digital signature against
    // judicial PKI and only releases Shard 2 if valid.
    this.logger.audit('hsm.shard.released', {
      courtOrderId: dto.courtOrderId,
      walletCount: dto.requestedWallets.length,
    });

    // Mock returns a fake shard — in real HSM this is actual key material
    return {
      shard2: Buffer.from(`mock-shard-2-for-${dto.courtOrderId}`).toString('base64'),
      releasedAt: new Date().toISOString(),
    };
  }
}
