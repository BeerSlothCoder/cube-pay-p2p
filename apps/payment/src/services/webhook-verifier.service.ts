import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class WebhookVerifierService {
  /**
   * Verifies Revolut webhook HMAC signature.
   * Uses timing-safe comparison to prevent timing attacks.
   * https://developer.revolut.com/docs/guides/accept-payments/tutorials/webhooks
   */
  verifyRevolutSignature(
    body: Record<string, unknown>,
    signature: string,
  ): boolean {
    if (!signature) return false;

    const secret = process.env.REVOLUT_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('REVOLUT_WEBHOOK_SECRET is not configured');
    }

    // Revolut sends: v1=<timestamp>.<signature>
    const [versionPart, sigPart] = signature.split(',');
    const [, timestamp] = versionPart?.split('=') ?? [];
    const [, hmac] = sigPart?.split('=') ?? [];

    if (!timestamp || !hmac) return false;

    // Revolut signs: timestamp.rawBody
    const payload = `${timestamp}.${JSON.stringify(body)}`;
    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(hmac, 'hex');

    if (expectedBuf.length !== providedBuf.length) return false;
    return timingSafeEqual(expectedBuf, providedBuf);
  }
}
