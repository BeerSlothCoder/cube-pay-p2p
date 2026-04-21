import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { JwtAuthGuard } from '@cubepay/auth';
import { CreateTerminalSchema, DiscoverTerminalsSchema } from '@cubepay/shared-types';
import { createZodDto } from 'nestjs-zod';

export class CreateTerminalDto extends createZodDto(CreateTerminalSchema) {}
export class DiscoverTerminalsDto extends createZodDto(DiscoverTerminalsSchema) {}

@Controller('terminals')
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  /** Seller deploys a new AR terminal */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTerminalDto) {
    return this.terminalsService.create(dto);
  }

  /** Buyer discovers nearby terminals via H3 spatial query */
  @Get('discover')
  discover(@Query() query: DiscoverTerminalsDto) {
    return this.terminalsService.discover(query);
  }

  /** Get a specific terminal's public details */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.terminalsService.findOne(id);
  }

  /** Seller pauses or reactivates their terminal */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'active' | 'paused' },
  ) {
    return this.terminalsService.updateStatus(id, body.status);
  }

  /** Seller removes terminal (triggers escrow refund if no active purchase) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.terminalsService.remove(id);
  }
}
