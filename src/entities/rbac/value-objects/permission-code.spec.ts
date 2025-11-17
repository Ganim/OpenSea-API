import { describe, expect, it } from 'vitest';
import { PermissionCode } from './permission-code';

describe('PermissionCode Value Object', () => {
  describe('create', () => {
    it('should create a valid permission code', () => {
      const code = PermissionCode.create('core.users.create');

      expect(code.value).toBe('core.users.create');
      expect(code.module).toBe('core');
      expect(code.resource).toBe('users');
      expect(code.action).toBe('create');
      expect(code.isWildcard).toBe(false);
    });

    it('should create a wildcard permission code', () => {
      const code = PermissionCode.create('stock.*.read');

      expect(code.value).toBe('stock.*.read');
      expect(code.module).toBe('stock');
      expect(code.resource).toBe('*');
      expect(code.action).toBe('read');
      expect(code.isWildcard).toBe(true);
    });

    it('should throw error for invalid format (missing parts)', () => {
      expect(() => PermissionCode.create('core.users')).toThrow();
    });

    it('should throw error for invalid format (too many parts)', () => {
      expect(() => PermissionCode.create('core.users.create.extra')).toThrow();
    });

    it('should throw error for empty parts', () => {
      expect(() => PermissionCode.create('core..create')).toThrow();
    });

    it('should throw error for invalid characters', () => {
      expect(() => PermissionCode.create('core.users@test.create')).toThrow();
    });
  });

  describe('createFromParts', () => {
    it('should create permission code from parts', () => {
      const code = PermissionCode.createFromParts('sales', 'orders', 'update');

      expect(code.value).toBe('sales.orders.update');
      expect(code.module).toBe('sales');
      expect(code.resource).toBe('orders');
      expect(code.action).toBe('update');
    });
  });

  describe('isValid', () => {
    it('should validate correct format', () => {
      expect(PermissionCode.isValid('core.users.create')).toBe(true);
      expect(PermissionCode.isValid('stock.products.read')).toBe(true);
      expect(PermissionCode.isValid('sales.orders.delete')).toBe(true);
    });

    it('should validate wildcards', () => {
      expect(PermissionCode.isValid('stock.*.read')).toBe(true);
      expect(PermissionCode.isValid('*.products.*')).toBe(true);
      expect(PermissionCode.isValid('*.*.*')).toBe(true);
    });

    it('should validate hyphens in names', () => {
      expect(PermissionCode.isValid('stock.purchase-orders.create')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(PermissionCode.isValid('core.users')).toBe(false);
      expect(PermissionCode.isValid('core')).toBe(false);
      expect(PermissionCode.isValid('')).toBe(false);
      expect(PermissionCode.isValid('core.users.create.extra')).toBe(false);
    });
  });

  describe('matches', () => {
    it('should match exact codes', () => {
      const code1 = PermissionCode.create('core.users.create');
      const code2 = PermissionCode.create('core.users.create');

      expect(code1.matches(code2)).toBe(true);
    });

    it('should not match different codes', () => {
      const code1 = PermissionCode.create('core.users.create');
      const code2 = PermissionCode.create('core.users.read');

      expect(code1.matches(code2)).toBe(false);
    });

    it('should match wildcard module', () => {
      const wildcard = PermissionCode.create('*.users.create');
      const specific = PermissionCode.create('core.users.create');

      expect(wildcard.matches(specific)).toBe(true);
      expect(specific.matches(wildcard)).toBe(true);
    });

    it('should match wildcard resource', () => {
      const wildcard = PermissionCode.create('stock.*.read');
      const specific = PermissionCode.create('stock.products.read');

      expect(wildcard.matches(specific)).toBe(true);
      expect(specific.matches(wildcard)).toBe(true);
    });

    it('should match wildcard action', () => {
      const wildcard = PermissionCode.create('sales.orders.*');
      const specific = PermissionCode.create('sales.orders.create');

      expect(wildcard.matches(specific)).toBe(true);
      expect(specific.matches(wildcard)).toBe(true);
    });

    it('should match multiple wildcards', () => {
      const wildcard = PermissionCode.create('*.products.*');
      const specific1 = PermissionCode.create('stock.products.create');
      const specific2 = PermissionCode.create('sales.products.read');

      expect(wildcard.matches(specific1)).toBe(true);
      expect(wildcard.matches(specific2)).toBe(true);
    });

    it('should match super wildcard', () => {
      const superWildcard = PermissionCode.create('*.*.*');
      const specific = PermissionCode.create('core.users.create');

      expect(superWildcard.matches(specific)).toBe(true);
    });

    it('should not match different modules', () => {
      const wildcard = PermissionCode.create('stock.*.read');
      const specific = PermissionCode.create('sales.products.read');

      expect(wildcard.matches(specific)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal codes', () => {
      const code1 = PermissionCode.create('core.users.create');
      const code2 = PermissionCode.create('core.users.create');

      expect(code1.equals(code2)).toBe(true);
    });

    it('should return false for different codes', () => {
      const code1 = PermissionCode.create('core.users.create');
      const code2 = PermissionCode.create('core.users.read');

      expect(code1.equals(code2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the code value as string', () => {
      const code = PermissionCode.create('core.users.create');

      expect(code.toString()).toBe('core.users.create');
    });
  });
});
