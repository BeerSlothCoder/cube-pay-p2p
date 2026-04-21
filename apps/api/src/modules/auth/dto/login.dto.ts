import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class LoginDto extends createZodDto(
  z.object({
    phone: z.string().min(7).max(20),
    otp: z.string().length(6),
    role: z.enum(['buyer', 'seller']),
  }),
) {}

export class RefreshDto extends createZodDto(
  z.object({
    refreshToken: z.string().min(10),
  }),
) {}
