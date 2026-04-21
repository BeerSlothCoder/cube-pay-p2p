import { Controller, Get, Param } from '@nestjs/common';
import { PricesService } from './prices.service';
import { SupportedCurrencySchema } from '@cubepay/shared-types';
import { BadRequestException } from '@nestjs/common';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get(':currency')
  async getPrice(@Param('currency') currency: string) {
    const parsed = SupportedCurrencySchema.safeParse(currency.toUpperCase());
    if (!parsed.success) throw new BadRequestException('Unsupported currency');
    return this.pricesService.getPrice(parsed.data);
  }
}
