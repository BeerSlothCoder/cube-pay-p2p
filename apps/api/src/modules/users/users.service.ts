import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/database.module';
import { CreateUserSchema } from '@cubepay/shared-types';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';

type CreateUserDto = z.infer<typeof CreateUserSchema>;

@Injectable()
export class UsersService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient) {}

  async create(dto: CreateUserDto) {
    // Store phone as one-way hash — never the raw number
    const phoneHash = createHash('sha256').update(dto.phone).digest('hex');

    const { data: existing } = await this.db
      .from('users')
      .select('id')
      .eq('phone_hash', phoneHash)
      .single();

    if (existing) throw new ConflictException('User already registered');

    const { data, error } = await this.db
      .from('users')
      .insert({
        id: randomUUID(),
        phone_hash: phoneHash,
        role: dto.role,
        kyc_status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select('id, role, kyc_status, created_at')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findById(userId: string) {
    const { data, error } = await this.db
      .from('users')
      .select('id, role, kyc_status, kyc_provider, created_at')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  }
}
