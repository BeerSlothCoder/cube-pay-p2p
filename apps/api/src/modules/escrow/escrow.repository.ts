import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/database.module';
import { randomUUID } from 'crypto';

@Injectable()
export class EscrowRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient) {}

  async create(data: Record<string, unknown>) {
    const { data: row, error } = await this.db
      .from('escrows')
      .insert({
        id: randomUUID(),
        ...data,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  }

  async findById(escrowId: string) {
    const { data, error } = await this.db
      .from('escrows')
      .select('id, status, tx_hash, chain_id, escrow_address, buyer_wallet, seller_wallet')
      .eq('id', escrowId)
      .single();

    if (error) return null;
    return data;
  }

  async updateStatus(escrowId: string, status: string, txHash?: string) {
    const { error } = await this.db
      .from('escrows')
      .update({
        status,
        ...(txHash && { tx_hash: txHash }),
        completed_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (error) throw new Error(error.message);
  }
}
