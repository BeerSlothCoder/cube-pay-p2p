import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JweService } from '@cubepay/crypto';

/**
 * NoPlaintextGuard
 *
 * Enforced on every write to the Blind Vault.
 * Rejects any payload where:
 * 1. encryptedBlob is not a valid compact JWE (5 parts, correct alg/enc)
 * 2. encryptedBlob contains detectable plaintext PII patterns
 *
 * This is a defence-in-depth layer — even if a developer accidentally
 * sends plaintext, it never reaches the database.
 */
@Injectable()
export class NoPlaintextGuard implements CanActivate {
  constructor(private readonly jwe: JweService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as { encryptedBlob?: string };

    if (!body.encryptedBlob) {
      throw new BadRequestException('encryptedBlob is required');
    }

    if (!this.jwe.isValidJweStructure(body.encryptedBlob)) {
      throw new BadRequestException(
        'encryptedBlob must be a valid compact JWE (RSA-OAEP-256 + A256GCM)',
      );
    }

    if (this.jwe.containsPlaintextPii(body.encryptedBlob)) {
      throw new BadRequestException(
        'Plaintext PII detected in blob — encryption required before upload',
      );
    }

    return true;
  }
}
