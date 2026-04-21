import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CubePayLogger } from '@cubepay/logger';
import { SupportedChain } from '@cubepay/shared-types';
import { ethers } from 'ethers';

interface ReleaseParams {
  chain: SupportedChain;
  contractAddress: string;
  escrowId: string;
  buyerWallet: string;
  nonce: number;
  signature: string;
}

// Minimal ABI — only the releaseToSeller function
const ESCROW_ABI = [
  'function releaseToSeller(bytes32 escrowId, address buyerWallet, uint256 nonce, bytes calldata oracleSignature) external',
];

@Injectable()
export class BlockchainService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: CubePayLogger,
  ) {
    this.logger.setContext('BlockchainService');
  }

  async submitRelease(params: ReleaseParams): Promise<string> {
    switch (params.chain) {
      case 'ethereum':
      case 'polygon':
      case 'base':
      case 'bsc':
        return this.submitEvmRelease(params);
      case 'solana':
        return this.submitSolanaRelease(params);
      case 'hedera':
        return this.submitHederaRelease(params);
      default:
        throw new Error(`Unsupported chain: ${params.chain}`);
    }
  }

  private async submitEvmRelease(params: ReleaseParams): Promise<string> {
    const rpcUrl = this.config.get<string>('evmRpcUrl');
    if (!rpcUrl) throw new Error('EVM_RPC_URL not configured');

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const privateKey = this.config.get<string>('oraclePrivateKey');
    if (!privateKey) throw new Error('Oracle wallet key not set');

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(params.contractAddress, ESCROW_ABI, wallet);

    const escrowIdBytes32 = ethers.utils.formatBytes32String(params.escrowId);
    const tx = await contract.releaseToSeller(
      escrowIdBytes32,
      params.buyerWallet,
      params.nonce,
      params.signature,
    );

    this.logger.audit('blockchain.tx.submitted', {
      chain: params.chain,
      txHash: tx.hash,
      escrowId: params.escrowId,
    });

    await tx.wait(1); // Wait for 1 confirmation
    return tx.hash as string;
  }

  private async submitSolanaRelease(params: ReleaseParams): Promise<string> {
    // TODO: implement Anchor program CPI for Solana escrow release
    throw new Error('Solana release not yet implemented');
  }

  private async submitHederaRelease(params: ReleaseParams): Promise<string> {
    // TODO: implement Hedera Smart Contract Service release via @hashgraph/sdk
    throw new Error('Hedera release not yet implemented');
  }
}
