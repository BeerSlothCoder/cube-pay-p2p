import { z } from 'zod';

// ─── Supported enums ───────────────────────────────────────────────────────

export const SupportedChainSchema = z.enum([
  'ethereum',
  'polygon',
  'base',
  'bsc',
  'solana',
  'hedera',
  'bitcoin',
  'cardano',
]);
export type SupportedChain = z.infer<typeof SupportedChainSchema>;

export const SupportedCurrencySchema = z.enum([
  'BTC',
  'ETH',
  'SOL',
  'ADA',
  'HBAR',
  'BNB',
  'USDC',
  'MATIC',
]);
export type SupportedCurrency = z.infer<typeof SupportedCurrencySchema>;

export const TerminalStatusSchema = z.enum([
  'active',
  'paused',
  'sold_out',
  'suspended',
  'pending_escrow',
  'expired',
]);
export type TerminalStatus = z.infer<typeof TerminalStatusSchema>;

export const EscrowStatusSchema = z.enum([
  'PENDING',
  'LOCKED',
  'RELEASING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);
export type EscrowStatus = z.infer<typeof EscrowStatusSchema>;

export const KycStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'REVIEW',
]);
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const KycLevelSchema = z.enum([
  'SIMPLIFIED',
  'STANDARD',
  'ENHANCED',
  'FULL',
]);
export type KycLevel = z.infer<typeof KycLevelSchema>;

// ─── Terminal schemas ──────────────────────────────────────────────────────

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  anchorPrecision: z.number().positive().default(5),
});

export const ARTerminalListingSchema = z.object({
  currency: SupportedCurrencySchema,
  availableAmount: z.string().regex(/^\d+(\.\d{1,18})?$/, 'Must be a valid decimal string'),
  priceSourceFeed: z.string().url(),
  premiumPercent: z.number().min(-5).max(10),
  minPurchase: z.string().regex(/^\d+(\.\d{1,18})?$/),
  maxPurchase: z.string().regex(/^\d+(\.\d{1,18})?$/),
});

export const CreateTerminalSchema = z.object({
  coordinates: CoordinatesSchema,
  listings: z.array(ARTerminalListingSchema).min(1).max(5),
  escrowContractAddress: z.string().min(26).max(128),
  escrowChain: SupportedChainSchema,
  durationHours: z.number().int().min(1).max(168).default(72),
});

export const DiscoverTerminalsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radiusKm: z.number().positive().max(50).default(10),
  currencies: z.array(SupportedCurrencySchema).optional(),
  minAmount: z.string().optional(),
  maxPremium: z.number().max(10).optional(),
  kycVerifiedOnly: z.boolean().default(true),
});

// ─── Escrow schemas ────────────────────────────────────────────────────────

export const CreateEscrowRecordSchema = z.object({
  escrowId: z.string().uuid(),
  terminalId: z.string().uuid(),
  chain: SupportedChainSchema,
  contractAddress: z.string().min(26).max(128),
  sellerWallet: z.string().min(26).max(128),
  cryptoCurrency: SupportedCurrencySchema,
  cryptoAmount: z.string().regex(/^\d+(\.\d{1,18})?$/),
  fiatCurrency: z.string().length(3),
  fiatAmountCents: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

// ─── User / KYC schemas ────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  role: z.enum(['buyer', 'seller']),
});

export const UpdateKycStatusSchema = z.object({
  userId: z.string().uuid(),
  kycStatus: KycStatusSchema,
  kycLevel: KycLevelSchema,
  kycProvider: z.enum(['sumsub', 'veriff', 'jumio']),
  kycReference: z.string().min(1).max(128),
});

// ─── Blind Vault schemas ───────────────────────────────────────────────────

export const StoreVaultRecordSchema = z.object({
  escrowId: z.string().uuid(),
  chainId: SupportedChainSchema,
  txHash: z.string().min(20).max(128),
  escrowAddress: z.string().min(26).max(128),
  buyerWallet: z.string().min(26).max(128),
  sellerWallet: z.string().min(26).max(128),
  encryptedBlob: z.string().min(100, 'Must be a valid JWE ciphertext'),
  encryptedTravelRuleBlob: z.string().optional(),
  status: EscrowStatusSchema,
});

// ─── Price schemas ─────────────────────────────────────────────────────────

export const PriceFeedSchema = z.object({
  currency: SupportedCurrencySchema,
  fiatCurrency: z.string().length(3),
  price: z.string().regex(/^\d+(\.\d{1,8})?$/),
  source: z.enum(['chainlink', 'coingecko', 'binance']),
  fetchedAt: z.number().int().positive(),
  signature: z.string().min(64),
});
