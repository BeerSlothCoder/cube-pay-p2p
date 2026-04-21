import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/database.module';
import { CubePayLogger } from '@cubepay/logger';
import { KycStatusSchema } from '@cubepay/shared-types';

@Injectable()
export class KycService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient,
    private readonly logger: CubePayLogger,
  ) {
    this.logger.setContext('KycService');
  }

  async handleWebhook(body: Record<string, unknown>) {
    // Sumsub webhook shape: { type, applicantId, reviewResult: { reviewAnswer } }
    const applicantId = body['applicantId'] as string;
    const reviewAnswer = (body['reviewResult'] as Record<string, string>)?.reviewAnswer;

    if (!applicantId || !reviewAnswer) {
      this.logger.warn('KYC webhook missing required fields');
      return;
    }

    const kycStatusMap: Record<string, string> = {
      GREEN: 'VERIFIED',
      RED: 'REJECTED',
      YELLOW: 'REVIEW',
    };

    const kycStatus = KycStatusSchema.safeParse(kycStatusMap[reviewAnswer]);
    if (!kycStatus.success) {
      this.logger.warn(`Unknown KYC review answer: ${reviewAnswer}`);
      return;
    }

    // Store ONLY status, provider, and reference — NEVER PII
    const { error } = await this.db
      .from('users')
      .update({
        kyc_status: kycStatus.data,
        kyc_provider: 'sumsub',
        kyc_reference: applicantId,
        kyc_verified_at: new Date().toISOString(),
      })
      .eq('kyc_reference', applicantId);

    if (error) {
      this.logger.error(`KYC update failed: ${error.message}`);
      return;
    }

    this.logger.audit('kyc.status.updated', {
      kycStatus: kycStatus.data,
      provider: 'sumsub',
      // No PII in audit log
    });
  }
}
