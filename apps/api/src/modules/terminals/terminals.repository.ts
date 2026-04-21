import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/database.module';
import { DiscoverTerminalsSchema } from '@cubepay/shared-types';
import { z } from 'zod';
import { randomUUID } from 'crypto';

type DiscoverQuery = z.infer<typeof DiscoverTerminalsSchema>;

@Injectable()
export class TerminalsRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient) {}

  async create(data: Record<string, unknown>) {
    const { data: row, error } = await this.db
      .from('ar_terminals')
      .insert({ id: randomUUID(), ...data, status: 'pending_escrow', created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  }

  async findByCells(cells: string[], filters: DiscoverQuery) {
    let query = this.db
      .from('ar_terminals')
      .select('id, h3_cell, listings, status, escrow_contract_address, escrow_chain, kyc_verified')
      .in('h3_cell', cells)
      .eq('status', 'active');

    if (filters.kycVerifiedOnly) {
      query = query.eq('kyc_verified', true);
    }

    if (filters.currencies?.length) {
      // Filter listings by currency (JSONB containment)
      query = query.contains('listings', filters.currencies.map((c) => ({ currency: c })));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(terminalId: string) {
    const { data, error } = await this.db
      .from('ar_terminals')
      .select('*')
      .eq('id', terminalId)
      .single();

    if (error) return null;
    return data;
  }

  async updateStatus(terminalId: string, status: string) {
    const { data, error } = await this.db
      .from('ar_terminals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', terminalId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(terminalId: string) {
    const { error } = await this.db
      .from('ar_terminals')
      .delete()
      .eq('id', terminalId);

    if (error) throw new Error(error.message);
  }
}
