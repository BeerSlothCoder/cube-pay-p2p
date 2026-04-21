import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { createHmac, timingSafeEqual } from 'crypto';

@Controller('webhooks/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /** Sumsub / Veriff webhook — KYC status callback */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleKycWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-payload-digest') digest: string,
  ) {
    if (!this.verifyDigest(body, digest)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.kycService.handleWebhook(body);
    return { received: true };
  }

  private verifyDigest(body: Record<string, unknown>, digest: string): boolean {
    if (!digest) return false;
    const secret = process.env.KYC_WEBHOOK_SECRET;
    if (!secret) return false;

    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    const provided = Buffer.from(digest, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');

    if (provided.length !== expectedBuf.length) return false;
    return timingSafeEqual(provided, expectedBuf);
  }
}
