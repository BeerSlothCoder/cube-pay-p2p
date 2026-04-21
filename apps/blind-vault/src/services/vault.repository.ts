import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/vault-database.module';
import { StoreVaultRecordSchema } from '@cubepay/shared-types';
import { z } from 'zod';
import { randomUUID } from 'crypto';

type StoreDto = z.infer<typeof StoreVaultRecordSchema>;

@Injectable()
export class VaultRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient) {}

  async insert(dto: StoreDto) {
    const { data, error } = await this.db
      .from('blind_vault_transactions')
      .insert({
        id: randomUUID(),
        chain_id: dto.chainId,
        tx_hash: dto.txHash,
        escrow_address: dto.escrowAddress,
        buyer_wallet: dto.buyerWallet,
        seller_wallet: dto.sellerWallet,
        encrypted_blob: dto.encryptedBlob,
        encrypted_travel_rule_blob: dto.encryptedTravelRuleBlob ?? null,
        status: dto.status,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw new Error(`Vault insert failed: ${error.message}`);
    return data;
  }

  async findByWallet(walletAddress: string, fromDate?: string, toDate?: string) {
    let query = this.db
      .from('blind_vault_transactions')
      .select(
        'id, chain_id, tx_hash, escrow_address, buyer_wallet, seller_wallet, encrypted_blob, encrypted_travel_rule_blob, status, created_at',
      )
      .or(`buyer_wallet.eq.${walletAddress},seller_wallet.eq.${walletAddress}`);

    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
