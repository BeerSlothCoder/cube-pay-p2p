import { z } from 'zod';
import { SupportedChainSchema, EscrowStatusSchema } from '@cubepay/shared-types';

// ─── escrow.release.confirmed job ─────────────────────────────────────────
// Published by: apps/oracle (after on-chain tx submitted)
// Consumed by:  apps/api (status update) + apps/blind-vault (store encrypted blob)

export const ReleaseConfirmedJobSchema = z.object({
  escrowId: z.string().uuid(),
  chain: SupportedChainSchema,
  txHash: z.string().min(20).max(128),
  buyerWallet: z.string().min(26).max(128),
  sellerWallet: z.string().min(26).max(128),
  contractAddress: z.string().min(26).max(128),
  status: EscrowStatusSchema,
  encryptedBlob: z.string().min(100),
  encryptedTravelRuleBlob: z.string().optional(),
  confirmedAt: z.number().int().positive(),
});

export type ReleaseConfirmedJob = z.infer<typeof ReleaseConfirmedJobSchema>;
