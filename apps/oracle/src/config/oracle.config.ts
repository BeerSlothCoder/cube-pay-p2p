import { z } from 'zod';

const OracleEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.enum(['true', 'false']).default('false'),
  // In production this comes from HSM — never from env file
  ORACLE_PRIVATE_KEY: z.string().min(32).optional(),
  USE_HSM: z.enum(['true', 'false']).default('false'),
  HSM_MOCK_URL: z.string().url().optional(),
  EVM_RPC_URL: z.string().url(),
  SOLANA_RPC_URL: z.string().url(),
  HEDERA_ACCOUNT_ID: z.string().optional(),
  HEDERA_PRIVATE_KEY: z.string().optional(),
});

export function validateOracleConfig(config: Record<string, unknown>) {
  const result = OracleEnvSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Oracle config validation failed: ${result.error.message}`);
  }
  if (result.data.NODE_ENV === 'production' && result.data.USE_HSM !== 'true') {
    throw new Error('USE_HSM must be true in production');
  }
  return result.data;
}

export const oracleConfig = () => ({
  useHsm: process.env.USE_HSM === 'true',
  hsmMockUrl: process.env.HSM_MOCK_URL,
  oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY,
  evmRpcUrl: process.env.EVM_RPC_URL,
  solanaRpcUrl: process.env.SOLANA_RPC_URL,
});
