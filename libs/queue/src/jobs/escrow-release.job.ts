import { z } from 'zod';
import { SupportedChainSchema } from '@cubepay/shared-types';

// ─── escrow.release job ────────────────────────────────────────────────────
// Published by: apps/payment (after Revolut webhook confirmed)
// Consumed by:  apps/oracle

export const EscrowReleaseJobSchema = z.object({
  escrowId: z.string().uuid(),
  buyerWallet: z.string().min(26).max(128),
  chain: SupportedChainSchema,
  contractAddress: z.string().min(26).max(128),
  nonce: z.number().int().positive(),
  revolut_order_id: z.string().min(1),
  idempotencyKey: z.string().uuid(),
  encryptedBlob: z.string().min(100),
  encryptedTravelRuleBlob: z.string().optional(),
  fiatAmountCents: z.number().int().positive(),
  sellerWallet: z.string().min(26).max(128),
  txHash: z.string().optional(),
});

export type EscrowReleaseJob = z.infer<typeof EscrowReleaseJobSchema>;
