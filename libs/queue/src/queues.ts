// All queue names as typed constants — shared across all apps

export const QUEUE_ESCROW_RELEASE = 'escrow.release' as const;
export const QUEUE_RELEASE_CONFIRMED = 'escrow.release.confirmed' as const;
export const QUEUE_KYC_RESULT = 'kyc.result' as const;
export const QUEUE_PRICE_REFRESH = 'oracle.price.refresh' as const;
export const QUEUE_VAULT_STORE = 'vault.store' as const;
