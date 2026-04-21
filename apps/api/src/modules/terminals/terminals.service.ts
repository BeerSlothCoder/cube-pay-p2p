import { Injectable, NotFoundException } from '@nestjs/common';
import { TerminalsRepository } from './terminals.repository';
import { CreateTerminalSchema, DiscoverTerminalsSchema } from '@cubepay/shared-types';
import { z } from 'zod';
// @ts-expect-error h3-js types
import { latLngToCell, gridDisk, cellToBoundary } from 'h3-js';

type CreateTerminalDto = z.infer<typeof CreateTerminalSchema>;
type DiscoverTerminalsDto = z.infer<typeof DiscoverTerminalsSchema>;

// H3 resolution 9 ≈ 100m hexagons — fine enough for AR anchoring
const H3_RESOLUTION = 9;

@Injectable()
export class TerminalsService {
  constructor(private readonly repo: TerminalsRepository) {}

  async create(dto: CreateTerminalDto) {
    const h3Cell = latLngToCell(
      dto.coordinates.latitude,
      dto.coordinates.longitude,
      H3_RESOLUTION,
    ) as string;

    return this.repo.create({ ...dto, h3Cell });
  }

  async discover(dto: DiscoverTerminalsDto) {
    const originCell = latLngToCell(dto.lat, dto.lon, H3_RESOLUTION) as string;
    // Convert km radius to H3 ring size (approx 1 ring ≈ 100m at res 9)
    const ringSize = Math.ceil((dto.radiusKm * 1000) / 100);
    const cells = gridDisk(originCell, ringSize) as string[];

    return this.repo.findByCells(cells, dto);
  }

  async findOne(terminalId: string) {
    const terminal = await this.repo.findById(terminalId);
    if (!terminal) throw new NotFoundException('Terminal not found');
    return terminal;
  }

  async updateStatus(terminalId: string, status: 'active' | 'paused') {
    const terminal = await this.repo.findById(terminalId);
    if (!terminal) throw new NotFoundException('Terminal not found');
    return this.repo.updateStatus(terminalId, status);
  }

  async remove(terminalId: string) {
    const terminal = await this.repo.findById(terminalId);
    if (!terminal) throw new NotFoundException('Terminal not found');
    return this.repo.remove(terminalId);
  }
}
