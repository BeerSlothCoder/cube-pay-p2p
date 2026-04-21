import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { EscrowRepository } from './escrow.repository';

@Module({
  controllers: [EscrowController],
  providers: [EscrowService, EscrowRepository],
  exports: [EscrowService],
})
export class EscrowModule {}
