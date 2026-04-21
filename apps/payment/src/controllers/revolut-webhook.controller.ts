import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { WebhookVerifierService } from '../services/webhook-verifier.service';
import { IdempotencyService } from '../services/idempotency.service';
import { PaymentQueueService } from '../services/payment-queue.service';
import { CubePayLogger } from '@cubepay/logger';
import { z } from 'zod';

// Revolut ORDER_COMPLETED webhook shape
const RevolutWebhookSchema = z.object({
  event: z.string(),
  order_id: z.string().min(1),
  merchant_order_ext_ref: z.string().uuid(), // This is our escrowId
  state: z.string(),
  metadata: z
    .object({
      escrow_id: z.string().uuid().optional(),
      buyer_wallet: z.string().optional(),
      chain: z.string().optional(),
      contract_address: z.string().optional(),
      encrypted_blob: z.string().optional(),
      nonce: z.string().optional(),
      seller_wallet: z.string().optional(),
      fiat_amount_cents: z.string().optional(),
    })
    .optional(),
});

@Controller('webhooks')
export class RevolutWebhookController {
  constructor(
    private readonly verifier: WebhookVerifierService,
    private readonly idempotency: IdempotencyService,
    private readonly queue: PaymentQueueService,
    private readonly logger: CubePayLogger,
  ) {
    this.logger.setContext('RevolutWebhookController');
  }

  @Post('revolut')
  @HttpCode(HttpStatus.OK)
  async handleRevolutWebhook(
    @Body() rawBody: Record<string, unknown>,
    @Headers('revolut-signature') signature: string,
  ) {
    // 1. Verify HMAC signature FIRST — before any processing
    const isValid = this.verifier.verifyRevolutSignature(rawBody, signature);
    if (!isValid) {
      this.logger.security('webhook.revolut.invalid_signature', { signature });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Parse and validate payload shape
    const parsed = RevolutWebhookSchema.safeParse(rawBody);
    if (!parsed.success) {
      this.logger.warn(`Invalid Revolut webhook shape: ${parsed.error.message}`);
      throw new BadRequestException('Invalid payload');
    }

    const payload = parsed.data;

    // 3. Only act on ORDER_COMPLETED
    if (payload.event !== 'ORDER_COMPLETED' || payload.state !== 'COMPLETED') {
      this.logger.log(`Ignored Revolut event: ${payload.event} / ${payload.state}`);
      return { received: true };
    }

    // 4. Idempotency check — Revolut can retry webhooks
    const idempotencyKey = `revolut:${payload.order_id}`;
    const alreadyProcessed = await this.idempotency.isProcessed(idempotencyKey);
    if (alreadyProcessed) {
      this.logger.log(`Duplicate webhook ignored: ${payload.order_id}`);
      return { received: true };
    }

    // 5. Mark as processing (before enqueue — prevents race condition)
    await this.idempotency.markProcessed(idempotencyKey);

    // 6. Enqueue the escrow release job
    const escrowId = payload.merchant_order_ext_ref;
    const meta = payload.metadata ?? {};

    await this.queue.enqueueEscrowRelease({
      escrowId,
      revolut_order_id: payload.order_id,
      buyerWallet: meta.buyer_wallet ?? '',
      chain: meta.chain ?? 'ethereum',
      contractAddress: meta.contract_address ?? '',
      nonce: parseInt(meta.nonce ?? '1', 10),
      encryptedBlob: meta.encrypted_blob ?? '',
      sellerWallet: meta.seller_wallet ?? '',
      fiatAmountCents: parseInt(meta.fiat_amount_cents ?? '0', 10),
      idempotencyKey,
    });

    this.logger.audit('payment.webhook.enqueued', {
      escrowId,
      orderId: payload.order_id,
    });

    return { received: true };
  }
}
