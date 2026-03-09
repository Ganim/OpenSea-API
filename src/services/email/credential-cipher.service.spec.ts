import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env before importing the service
vi.mock('@/@env', () => ({
  env: {
    EMAIL_CREDENTIALS_KEY: 'a]3Kd9$mP!xR7vL@nQ2wY5tH8jF0cBzU', // 32 chars raw
    EMAIL_CREDENTIALS_KEY_PREVIOUS: undefined as string | undefined,
  },
}));

import { env } from '@/@env';
import { CredentialCipherService } from './credential-cipher.service';

describe('CredentialCipherService', () => {
  let service: CredentialCipherService;

  beforeEach(() => {
    (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY =
      'a]3Kd9$mP!xR7vL@nQ2wY5tH8jF0cBzU';
    (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS = undefined;
    service = new CredentialCipherService();
  });

  describe('encrypt + decrypt', () => {
    it('should encrypt and decrypt a string', () => {
      const plain = 'my-super-secret-password';
      const encrypted = service.encrypt(plain);

      expect(encrypted).not.toBe(plain);
      expect(service.decrypt(encrypted)).toBe(plain);
    });

    it('should produce different ciphertexts for the same input (random IV)', () => {
      const plain = 'test123';
      const a = service.encrypt(plain);
      const b = service.encrypt(plain);
      expect(a).not.toBe(b);
    });

    it('should throw on empty input', () => {
      expect(() => service.encrypt('')).toThrow('Credential text is required');
      expect(() => service.decrypt('')).toThrow(
        'Encrypted credential is required',
      );
    });

    it('should throw on invalid encrypted payload', () => {
      expect(() => service.decrypt('not-valid-base64!!')).toThrow(
        'Invalid encrypted credential payload',
      );
    });
  });

  describe('decryptWithRotation', () => {
    it('should decrypt with current key and set needsReEncrypt to false', () => {
      const plain = 'password123';
      const encrypted = service.encrypt(plain);

      const result = service.decryptWithRotation(encrypted);
      expect(result.plainText).toBe(plain);
      expect(result.needsReEncrypt).toBe(false);
    });

    it('should fallback to previous key and set needsReEncrypt to true', () => {
      const oldKey = 'a]3Kd9$mP!xR7vL@nQ2wY5tH8jF0cBzU';
      const newKey = 'Z9xR7vL@nQ2wY5tH8jF0cBzUa]3Kd9$m';

      // Encrypt with old key
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY = oldKey;
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS =
        undefined;
      const oldService = new CredentialCipherService();
      const encrypted = oldService.encrypt('my-secret');

      // Create new service with rotated keys
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY = newKey;
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS = oldKey;
      const newService = new CredentialCipherService();

      const result = newService.decryptWithRotation(encrypted);
      expect(result.plainText).toBe('my-secret');
      expect(result.needsReEncrypt).toBe(true);
    });

    it('should throw when neither current nor previous key works', () => {
      const encrypted = service.encrypt('test');

      // Create service with completely different keys
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY =
        'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ';
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS =
        'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY';
      const wrongService = new CredentialCipherService();

      expect(() => wrongService.decryptWithRotation(encrypted)).toThrow(
        'Failed to decrypt credential with current or previous key',
      );
    });

    it('should decrypt() use rotation transparently', () => {
      const oldKey = 'a]3Kd9$mP!xR7vL@nQ2wY5tH8jF0cBzU';
      const newKey = 'Z9xR7vL@nQ2wY5tH8jF0cBzUa]3Kd9$m';

      // Encrypt with old key
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY = oldKey;
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS =
        undefined;
      const oldService = new CredentialCipherService();
      const encrypted = oldService.encrypt('transparent-test');

      // decrypt() on new service should work via rotation
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY = newKey;
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS = oldKey;
      const newService = new CredentialCipherService();

      expect(newService.decrypt(encrypted)).toBe('transparent-test');
    });

    it('should re-encrypt with current key after rotation', () => {
      const oldKey = 'a]3Kd9$mP!xR7vL@nQ2wY5tH8jF0cBzU';
      const newKey = 'Z9xR7vL@nQ2wY5tH8jF0cBzUa]3Kd9$m';

      // Encrypt with old key
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY = oldKey;
      const oldService = new CredentialCipherService();
      const encrypted = oldService.encrypt('rotate-me');

      // Rotate keys
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY = newKey;
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS = oldKey;
      const newService = new CredentialCipherService();

      // Decrypt with rotation
      const result = newService.decryptWithRotation(encrypted);
      expect(result.needsReEncrypt).toBe(true);

      // Re-encrypt with current key
      const reEncrypted = newService.encrypt(result.plainText);

      // Now decrypt should work with current key only (no rotation needed)
      (env as Record<string, unknown>).EMAIL_CREDENTIALS_KEY_PREVIOUS =
        undefined;
      const finalService = new CredentialCipherService();

      const finalResult = finalService.decryptWithRotation(reEncrypted);
      expect(finalResult.plainText).toBe('rotate-me');
      expect(finalResult.needsReEncrypt).toBe(false);
    });
  });
});
