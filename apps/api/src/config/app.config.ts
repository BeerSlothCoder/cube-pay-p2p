import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  FRONTEND_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  INTERNAL_API_KEY: z.string().min(32),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.enum(['true', 'false']).default('false'),
  BLIND_VAULT_URL: z.string().url().default('http://localhost:3004'),
  REGULATORY_PUBLIC_KEY_PEM: z.string().min(100),
});

export function validateConfig(config: Record<string, unknown>) {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation failed: ${result.error.message}`);
  }
  return result.data;
}

export const appConfig = () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  env: process.env.NODE_ENV ?? 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  jwtSecret: process.env.JWT_SECRET,
  blindVaultUrl: process.env.BLIND_VAULT_URL ?? 'http://localhost:3004',
  internalApiKey: process.env.INTERNAL_API_KEY,
  regulatoryPublicKeyPem: process.env.REGULATORY_PUBLIC_KEY_PEM,
});
