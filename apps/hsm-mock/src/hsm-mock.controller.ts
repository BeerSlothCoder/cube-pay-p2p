import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { HsmMockService } from './hsm-mock.service';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const SignRequestSchema = z.object({
  escrowId: z.string().uuid(),
  buyerWallet: z.string().min(26).max(128),
  nonce: z.number().int().positive(),
});

class SignRequestDto extends createZodDto(SignRequestSchema) {}

const CourtOrderSchema = z.object({
  courtOrderId: z.string().min(1),
  signedByJudge: z.string().min(10),
  requestedWallets: z.array(z.string().min(26)),
});

class CourtOrderDto extends createZodDto(CourtOrderSchema) {}

/**
 * HsmMockController
 *
 * Simulates AWS CloudHSM for local development.
 * In production, this service does NOT run — the oracle connects to real HSM.
 */
@Controller('hsm')
export class HsmMockController {
  constructor(private readonly hsmService: HsmMockService) {}

  /** Simulate oracle signing key operation */
  @Post('sign')
  @HttpCode(HttpStatus.OK)
  sign(@Body() dto: SignRequestDto) {
    return this.hsmService.sign(dto.escrowId, dto.buyerWallet, dto.nonce);
  }

  /** Simulate Shard 2 release on court order */
  @Post('release-shard')
  @HttpCode(HttpStatus.OK)
  releaseShard(@Body() dto: CourtOrderDto) {
    return this.hsmService.releaseShardForCourtOrder(dto);
  }
}
