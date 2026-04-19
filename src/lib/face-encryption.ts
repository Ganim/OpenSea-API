/**
 * Face embedding encryption helper.
 *
 * Encrypts/decrypts 128-d Float32Array face embeddings (~512 bytes) using
 * AES-256-GCM with a per-row 96-bit IV (NIST SP 800-38D §8.2 recommended)
 * and a 128-bit authentication tag.
 *
 * Key is loaded LAZILY from `process.env.FACE_ENROLLMENT_ENCRYPTION_KEY`
 * on the first call to `encryptEmbedding` / `decryptEmbedding`. Importing
 * this module does NOT touch the env — callers (mappers, factories, specs)
 * can safely import it without setting the key at startup.
 *
 * @remarks
 * **Endianness note (Pitfall 3 from 05-RESEARCH.md):**
 * The plaintext bytes captured from `Float32Array.buffer` are host-endian.
 * Encryption + decryption MUST happen on the same host class. Fly.io runs
 * x86_64 (little-endian) by default; do not move decrypt to ARM64 without
 * switching to an explicit `DataView.setFloat32(..., true)` serializer.
 *
 * @see .planning/phases/05-kiosk-qr-face-match/05-RESEARCH.md §Pattern 2
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm' as const;
const IV_LENGTH = 12; // 96 bits — NIST SP 800-38D §8.2 recommended for GCM
const TAG_LENGTH = 16; // 128 bits — default/recommended

function getKey(): Buffer {
  const b64 = process.env.FACE_ENROLLMENT_ENCRYPTION_KEY;
  if (!b64) {
    throw new Error('FACE_ENROLLMENT_ENCRYPTION_KEY is not set');
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    throw new Error(
      'FACE_ENROLLMENT_ENCRYPTION_KEY must decode to exactly 32 bytes (256 bits)',
    );
  }
  return key;
}

export interface EncryptedEmbedding {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export function encryptEmbedding(v: Float32Array): EncryptedEmbedding {
  const plaintext = Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv, {
    authTagLength: TAG_LENGTH,
  });
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

export function decryptEmbedding(e: EncryptedEmbedding): Float32Array {
  const decipher = createDecipheriv(ALGO, getKey(), e.iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(e.authTag);
  const plaintext = Buffer.concat([
    decipher.update(e.ciphertext),
    decipher.final(),
  ]);
  // Buffer → Float32Array (share memory, reinterpret host-endian).
  // We slice the buffer because Node may allocate plaintext into a larger
  // pooled ArrayBuffer; we need exactly byteLength starting at byteOffset.
  return new Float32Array(
    plaintext.buffer.slice(
      plaintext.byteOffset,
      plaintext.byteOffset + plaintext.byteLength,
    ),
  );
}
