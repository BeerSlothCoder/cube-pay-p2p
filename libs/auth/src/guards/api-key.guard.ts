import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * ApiKeyGuard — used for internal service-to-service calls
 * (e.g. apps/api → apps/blind-vault).
 * Uses timing-safe comparison to prevent timing attacks.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-internal-key'];

    if (!providedKey || typeof providedKey !== 'string') {
      throw new UnauthorizedException('Missing internal API key');
    }

    const expectedKey = process.env.INTERNAL_API_KEY;
    if (!expectedKey) {
      throw new UnauthorizedException('Service not configured');
    }

    // Timing-safe comparison prevents brute-force timing attacks
    const provided = Buffer.from(providedKey, 'utf8');
    const expected = Buffer.from(expectedKey, 'utf8');

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
