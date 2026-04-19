import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type {
  EncryptedEmbedding,
  decryptEmbedding as DecryptEmbedding,
  encryptEmbedding as EncryptEmbedding,
} from './face-encryption';

const ENV_KEY = 'FACE_ENROLLMENT_ENCRYPTION_KEY';

function makeRandomEmbedding(): Float32Array {
  const arr = new Float32Array(128);
  for (let i = 0; i < 128; i++) {
    arr[i] = Math.random() * 2 - 1;
  }
  return arr;
}

describe('face-encryption helper', () => {
  let originalEnvValue: string | undefined;

  // We import lazily because the module under test must NOT eagerly read the env
  // at import-time (Task 1 acceptance: getKey() is lazy).
  let faceEnc: {
    encryptEmbedding: typeof EncryptEmbedding;
    decryptEmbedding: typeof DecryptEmbedding;
    EncryptedEmbedding: EncryptedEmbedding; // type-only re-export sentinel
  };

  beforeAll(async () => {
    originalEnvValue = process.env[ENV_KEY];
    process.env[ENV_KEY] = randomBytes(32).toString('base64');
    faceEnc = (await import('./face-encryption')) as unknown as typeof faceEnc;
  });

  afterAll(() => {
    if (originalEnvValue === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = originalEnvValue;
    }
  });

  it('round-trips a random Float32Array(128) bit-identically', () => {
    const original = makeRandomEmbedding();
    const encrypted = faceEnc.encryptEmbedding(original);
    const decrypted = faceEnc.decryptEmbedding(encrypted);

    expect(decrypted).toBeInstanceOf(Float32Array);
    expect(decrypted.length).toBe(original.length);
    for (let i = 0; i < original.length; i++) {
      // Byte-identical floats must compare exactly equal (no FP drift on
      // pure encrypt/decrypt — we never run any arithmetic on them).
      expect(Math.abs(decrypted[i] - original[i])).toBeLessThanOrEqual(
        Number.EPSILON,
      );
    }
  });

  it('throws when authTag is tampered', () => {
    const original = makeRandomEmbedding();
    const encrypted = faceEnc.encryptEmbedding(original);
    const tampered = {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: Buffer.from(encrypted.authTag),
    };
    tampered.authTag[0] ^= 1; // flip one bit
    expect(() => faceEnc.decryptEmbedding(tampered)).toThrow();
  });

  it('produces different ciphertext on consecutive calls (random IV)', () => {
    const original = makeRandomEmbedding();
    const a = faceEnc.encryptEmbedding(original);
    const b = faceEnc.encryptEmbedding(original);
    expect(a.iv.equals(b.iv)).toBe(false);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
  });

  it('throws when key decodes to fewer than 32 bytes', () => {
    const previous = process.env[ENV_KEY];
    // 16 bytes — half of the required 32
    process.env[ENV_KEY] = randomBytes(16).toString('base64');
    try {
      const original = makeRandomEmbedding();
      expect(() => faceEnc.encryptEmbedding(original)).toThrow(
        /must decode to exactly 32 bytes/i,
      );
    } finally {
      process.env[ENV_KEY] = previous;
    }
  });

  it('throws when env var is missing', () => {
    const previous = process.env[ENV_KEY];
    delete process.env[ENV_KEY];
    try {
      const original = makeRandomEmbedding();
      expect(() => faceEnc.encryptEmbedding(original)).toThrow(
        /FACE_ENROLLMENT_ENCRYPTION_KEY is not set/i,
      );
    } finally {
      process.env[ENV_KEY] = previous;
    }
  });
});

describe('face-encryption helper — lazy env loading', () => {
  it('does NOT throw at module import time when env var is missing', async () => {
    // Use vitest module reset semantics (vi.resetModules) so we re-import freshly
    // with the env var unset. This guards against accidentally moving getKey() to
    // module top-level.
    const previous = process.env[ENV_KEY];
    delete process.env[ENV_KEY];
    try {
      const { resetModules } = await import('vitest').then((m) => ({
        resetModules: m.vi.resetModules.bind(m.vi),
      }));
      resetModules();
      // The dynamic import below MUST resolve without error.
      await expect(import('./face-encryption')).resolves.toBeDefined();
    } finally {
      if (previous !== undefined) {
        process.env[ENV_KEY] = previous;
      }
    }
  });
});
