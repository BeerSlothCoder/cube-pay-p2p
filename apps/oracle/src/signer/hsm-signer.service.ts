import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CubePayLogger } from '@cubepay/logger';

/**
 * HsmSignerService
 *
 * In production: delegates to AWS CloudHSM via PKCS#11.
 * In development (USE_HSM=false): uses ORACLE_PRIVATE_KEY env var.
 *
 * The oracle private key NEVER leaves the HSM in production.
 */
@Injectable()
export class HsmSignerService {
  private readonly useHsm: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: CubePayLogger,
  ) {
    this.useHsm = config.get<boolean>('useHsm') ?? false;
    this.logger.setContext('HsmSignerService');

    if (!this.useHsm) {
      this.logger.warn('HSM disabled — using software key. DEVELOPMENT MODE ONLY.');
    }
  }

  /**
   * Signs (escrowId, buyerWallet, nonce) for EVM ecrecover verification.
   * Returns a 65-byte hex signature.
   */
  async signEscrowRelease(
    escrowId: string,
    buyerWallet: string,
    nonce: number,
  ): Promise<string> {
    if (this.useHsm) {
      return this.signViaHsm(escrowId, buyerWallet, nonce);
    }
    return this.signViaSoftwareKey(escrowId, buyerWallet, nonce);
  }

  private async signViaSoftwareKey(
    escrowId: string,
    buyerWallet: string,
    nonce: number,
  ): Promise<string> {
    const { Wallet, utils } = await import('ethers');
    const privateKey = this.config.get<string>('oraclePrivateKey');
    if (!privateKey) throw new Error('ORACLE_PRIVATE_KEY not set');

    const wallet = new Wallet(privateKey);
    const msgHash = utils.solidityKeccak256(
      ['bytes32', 'address', 'uint256'],
      [utils.formatBytes32String(escrowId), buyerWallet, nonce],
    );
    return wallet.signMessage(utils.arrayify(msgHash));
  }

  private async signViaHsm(
    escrowId: string,
    buyerWallet: string,
    nonce: number,
  ): Promise<string> {
    // TODO: implement AWS CloudHSM PKCS#11 signing via pkijs
    // The signing request goes to the HSM over the internal CU interface
    // The private key never leaves the HSM hardware
    throw new Error('HSM signing not yet implemented — connect pkijs + CloudHSM');
  }
}
