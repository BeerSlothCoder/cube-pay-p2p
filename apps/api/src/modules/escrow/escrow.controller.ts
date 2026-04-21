import { Controller, Post, Get, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '@cubepay/auth';
import { createZodDto } from 'nestjs-zod';
import { CreateEscrowRecordSchema } from '@cubepay/shared-types';

export class CreateEscrowDto extends createZodDto(CreateEscrowRecordSchema) {}

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  /** Buyer records on-chain escrow lock after seller deploys terminal */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateEscrowDto) {
    return this.escrowService.create(dto);
  }

  /** Buyer polls escrow status (PENDING → COMPLETED / FAILED) */
  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  status(@Param('id', ParseUUIDPipe) id: string) {
    return this.escrowService.getStatus(id);
  }
}
