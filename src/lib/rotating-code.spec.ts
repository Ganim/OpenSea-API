import { describe, expect, it } from 'vitest';
import {
  generateRotatingCode,
  generateRotatingSecret,
  getCurrentBucket,
  getCurrentRotatingCode,
  isValidRotatingCode,
} from './rotating-code';

describe('rotating-code', () => {
  const secret = 'a'.repeat(64);

  describe('generateRotatingCode', () => {
    it('produz saída determinística dado o mesmo secret e bucket', () => {
      const c1 = generateRotatingCode(secret, 100);
      const c2 = generateRotatingCode(secret, 100);
      expect(c1).toBe(c2);
    });

    it('produz códigos diferentes para buckets diferentes', () => {
      const c1 = generateRotatingCode(secret, 100);
      const c2 = generateRotatingCode(secret, 101);
      expect(c1).not.toBe(c2);
    });

    it('respeita codeLength configurado', () => {
      expect(generateRotatingCode(secret, 1, { codeLength: 8 })).toHaveLength(
        8,
      );
      expect(generateRotatingCode(secret, 1, { codeLength: 4 })).toHaveLength(
        4,
      );
    });

    it('usa apenas caracteres do CHARSET alfanumérico 32', () => {
      const code = generateRotatingCode(secret, 42);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    });
  });

  describe('getCurrentBucket', () => {
    it('divide o tempo por bucketSeconds', () => {
      const ref = new Date(120_000); // 120s
      expect(getCurrentBucket(ref, 60)).toBe(2);
      expect(getCurrentBucket(ref, 30)).toBe(4);
    });
  });

  describe('getCurrentRotatingCode', () => {
    it('retorna code, expiresAt e periodSeconds', () => {
      const now = new Date(60_000);
      const result = getCurrentRotatingCode(secret, now);
      expect(result.code).toHaveLength(6);
      expect(result.periodSeconds).toBe(60);
      expect(result.expiresAt.getTime()).toBe(120_000);
    });

    it('respeita config customizado', () => {
      const now = new Date(60_000);
      const result = getCurrentRotatingCode(secret, now, {
        bucketSeconds: 120,
        codeLength: 8,
      });
      expect(result.code).toHaveLength(8);
      expect(result.periodSeconds).toBe(120);
    });
  });

  describe('isValidRotatingCode', () => {
    it('aceita o bucket atual', () => {
      const now = new Date(60_000);
      const { code } = getCurrentRotatingCode(secret, now);
      expect(isValidRotatingCode(secret, code, now)).toBe(true);
    });

    it('aceita o bucket anterior dentro da tolerância default (1)', () => {
      const now = new Date(60_000);
      const future = new Date(120_000); // 1 bucket depois
      const { code: previousCode } = getCurrentRotatingCode(secret, now);
      expect(isValidRotatingCode(secret, previousCode, future)).toBe(true);
    });

    it('rejeita códigos de 2 buckets atrás com tolerância default', () => {
      const now = new Date(60_000);
      const muchLater = new Date(180_000); // 2 buckets depois
      const { code: oldCode } = getCurrentRotatingCode(secret, now);
      expect(isValidRotatingCode(secret, oldCode, muchLater)).toBe(false);
    });

    it('aceita tolerância customizada', () => {
      const now = new Date(60_000);
      const muchLater = new Date(180_000);
      const { code } = getCurrentRotatingCode(secret, now);
      expect(
        isValidRotatingCode(secret, code, muchLater, { tolerance: 2 }),
      ).toBe(true);
    });

    it('rejeita códigos errados', () => {
      const now = new Date(60_000);
      expect(isValidRotatingCode(secret, 'AAAAAA', now)).toBe(false);
    });
  });

  describe('generateRotatingSecret', () => {
    it('retorna 64 hex chars', () => {
      const s = generateRotatingSecret();
      expect(s).toHaveLength(64);
      expect(s).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produz valores únicos', () => {
      const a = generateRotatingSecret();
      const b = generateRotatingSecret();
      expect(a).not.toBe(b);
    });
  });
});
