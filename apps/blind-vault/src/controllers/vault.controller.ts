import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VaultService } from '../services/vault.service';
import { ApiKeyGuard } from '@cubepay/auth';
import { NoPlaintextGuard } from '../guards/no-plaintext.guard';
import { createZodDto } from 'nestjs-zod';
import { StoreVaultRecordSchema } from '@cubepay/shared-types';
import { z } from 'zod';

export class StoreVaultDto extends createZodDto(StoreVaultRecordSchema) {}

const ExportQuerySchema = z.object({
  walletAddress: z.string().min(26).max(128),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
export class ExportQueryDto extends createZodDto(ExportQuerySchema) {}

@Controller('vault')
@UseGuards(ApiKeyGuard) // All vault endpoints require internal API key
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  /**
   * Store an encrypted transaction blob.
   * NoPlaintextGuard enforces JWE structure before this runs.
   */
  @Post('store')
  @UseGuards(NoPlaintextGuard)
  @HttpCode(HttpStatus.CREATED)
  store(@Body() dto: StoreVaultDto) {
    return this.vaultService.store(dto);
  }

  /**
   * Export encrypted blobs for regulatory authority.
   * Returns ONLY ciphertext — no decryption happens here ever.
   */
  @Get('export')
  export(@Query() query: ExportQueryDto) {
    return this.vaultService.exportForAuthority(query);
  }
}
