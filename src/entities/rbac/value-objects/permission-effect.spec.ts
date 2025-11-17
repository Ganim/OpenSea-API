import { describe, expect, it } from 'vitest';
import { PermissionEffect } from './permission-effect';

describe('PermissionEffect Value Object', () => {
  describe('create', () => {
    it('should create allow effect', () => {
      const effect = PermissionEffect.create('allow');

      expect(effect.value).toBe('allow');
      expect(effect.isAllow).toBe(true);
      expect(effect.isDeny).toBe(false);
    });

    it('should create deny effect', () => {
      const effect = PermissionEffect.create('deny');

      expect(effect.value).toBe('deny');
      expect(effect.isAllow).toBe(false);
      expect(effect.isDeny).toBe(true);
    });

    it('should throw error for invalid effect', () => {
      expect(() => PermissionEffect.create('invalid')).toThrow();
      expect(() => PermissionEffect.create('ALLOW')).toThrow();
      expect(() => PermissionEffect.create('')).toThrow();
    });
  });

  describe('allow', () => {
    it('should create allow effect', () => {
      const effect = PermissionEffect.allow();

      expect(effect.value).toBe('allow');
      expect(effect.isAllow).toBe(true);
      expect(effect.isDeny).toBe(false);
    });
  });

  describe('deny', () => {
    it('should create deny effect', () => {
      const effect = PermissionEffect.deny();

      expect(effect.value).toBe('deny');
      expect(effect.isAllow).toBe(false);
      expect(effect.isDeny).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should validate correct effects', () => {
      expect(PermissionEffect.isValid('allow')).toBe(true);
      expect(PermissionEffect.isValid('deny')).toBe(true);
    });

    it('should reject invalid effects', () => {
      expect(PermissionEffect.isValid('invalid')).toBe(false);
      expect(PermissionEffect.isValid('ALLOW')).toBe(false);
      expect(PermissionEffect.isValid('DENY')).toBe(false);
      expect(PermissionEffect.isValid('')).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal effects', () => {
      const effect1 = PermissionEffect.allow();
      const effect2 = PermissionEffect.allow();

      expect(effect1.equals(effect2)).toBe(true);
    });

    it('should return false for different effects', () => {
      const allow = PermissionEffect.allow();
      const deny = PermissionEffect.deny();

      expect(allow.equals(deny)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the effect value as string', () => {
      const allow = PermissionEffect.allow();
      const deny = PermissionEffect.deny();

      expect(allow.toString()).toBe('allow');
      expect(deny.toString()).toBe('deny');
    });
  });
});
