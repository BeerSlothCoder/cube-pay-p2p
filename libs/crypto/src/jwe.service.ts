import { Injectable } from '@nestjs/common';
import { importSPKI, CompactEncrypt, compactDecrypt, importPKCS8 } from 'jose';
import { createHash } from 'crypto';

/**
 * JweService — runs ONLY on the client side (React Native / PWA).
 * On the server this service is used ONLY for validation
 * (checking JWE structure). It never decrypts.
 */
@Injectable()
export class JweService {
  /**
   * Verifies that a string looks like a valid compact JWE token.
   * Server never decrypts — this is structure-only validation.
   */
  isValidJweStructure(blob: string): boolean {
    const parts = blob.split('.');
    // Compact JWE always has 5 dot-separated base64url parts
    if (parts.length !== 5) return false;
    // Header must decode to JSON with alg + enc
    try {
      const header = JSON.parse(
        Buffer.from(parts[0], 'base64url').toString('utf8'),
      );
      return (
        typeof header.alg === 'string' &&
        typeof header.enc === 'string' &&
        header.alg === 'RSA-OAEP-256' &&
        header.enc === 'A256GCM'
      );
    } catch {
      return false;
    }
  }

  /**
   * Checks that a blob does NOT contain detectable plaintext PII patterns.
   * Runs on the server before storing in Blind Vault.
   */
  containsPlaintextPii(blob: string): boolean {
    const piiPatterns = [
      /"name"\s*:/i,
      /"email"\s*:/i,
      /"phone"\s*:/i,
      /"address"\s*:/i,
      /"amount"\s*:\s*\d/,
      /"fiatAmount"\s*:/i,
      /"cryptoAmount"\s*:/i,
    ];
    return piiPatterns.some((pattern) => pattern.test(blob));
  }

  /**
   * Hashes a value (e.g. IP address) before storage.
   * One-way — cannot be reversed by CubePay.
   */
  hashForStorage(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  // ─── Client-side helpers (used in React Native / PWA only) ──────────────

  /**
   * Encrypts transaction metadata on the user's device using
   * the Regulatory Public Key. This function NEVER runs on CubePay servers.
   */
  async encryptForRegulator(
    plaintext: object,
    regulatoryPublicKeyPem: string,
  ): Promise<string> {
    const publicKey = await importSPKI(regulatoryPublicKeyPem, 'RSA-OAEP-256');
    const encoder = new TextEncoder();

    const jwe = await new CompactEncrypt(
      encoder.encode(JSON.stringify(plaintext)),
    )
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(publicKey);

    return jwe;
  }

  /**
   * Decrypts a JWE — ONLY used by regulatory authorities with reconstructed key.
   * This NEVER runs inside CubePay's production services.
   */
  async decrypt(
    jwe: string,
    regulatoryPrivateKeyPem: string,
  ): Promise<unknown> {
    const privateKey = await importPKCS8(
      regulatoryPrivateKeyPem,
      'RSA-OAEP-256',
    );
    const { plaintext } = await compactDecrypt(jwe, privateKey);
    return JSON.parse(new TextDecoder().decode(plaintext));
  }
}
