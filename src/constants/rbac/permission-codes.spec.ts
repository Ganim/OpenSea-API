import { describe, expect, it } from 'vitest';
import { isValidPermissionCode, parsePermissionCode } from './permission-codes';

describe('isValidPermissionCode', () => {
  it('should accept 3-level codes', () => {
    expect(isValidPermissionCode('stock.products.access')).toBe(true);
    expect(isValidPermissionCode('hr.employees.modify')).toBe(true);
    expect(isValidPermissionCode('finance.cost-centers.remove')).toBe(true);
  });

  it('should accept 4-level codes', () => {
    expect(isValidPermissionCode('tools.email.accounts.access')).toBe(true);
    expect(isValidPermissionCode('tools.tasks.boards.share')).toBe(true);
    expect(isValidPermissionCode('tools.storage.files.onlyself')).toBe(true);
  });

  it('should reject 1-level codes', () => {
    expect(isValidPermissionCode('stock')).toBe(false);
  });

  it('should reject 2-level codes', () => {
    expect(isValidPermissionCode('stock.products')).toBe(false);
  });

  it('should reject 5-level codes', () => {
    expect(isValidPermissionCode('a.b.c.d.e')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidPermissionCode('')).toBe(false);
  });
});

describe('parsePermissionCode', () => {
  describe('3-level codes', () => {
    it('should parse module, resource, and action', () => {
      const result = parsePermissionCode('stock.products.access');
      expect(result).toEqual({
        module: 'stock',
        resource: 'products',
        action: 'access',
      });
    });

    it('should handle kebab-case resources', () => {
      const result = parsePermissionCode('finance.cost-centers.modify');
      expect(result).toEqual({
        module: 'finance',
        resource: 'cost-centers',
        action: 'modify',
      });
    });
  });

  describe('4-level codes', () => {
    it('should absorb sub-resource into resource field', () => {
      const result = parsePermissionCode('tools.email.accounts.access');
      expect(result).toEqual({
        module: 'tools',
        resource: 'email.accounts',
        action: 'access',
      });
    });

    it('should handle all tools sub-resources', () => {
      expect(parsePermissionCode('tools.tasks.boards.share')).toEqual({
        module: 'tools',
        resource: 'tasks.boards',
        action: 'share',
      });

      expect(parsePermissionCode('tools.storage.files.onlyself')).toEqual({
        module: 'tools',
        resource: 'storage.files',
        action: 'onlyself',
      });
    });

    it('should work for future 4-level codes outside tools', () => {
      const result = parsePermissionCode('sales.bids.proposals.access');
      expect(result).toEqual({
        module: 'sales',
        resource: 'bids.proposals',
        action: 'access',
      });
    });
  });

  describe('invalid codes', () => {
    it('should throw for 2-level codes', () => {
      expect(() => parsePermissionCode('stock.products')).toThrow(
        'Invalid permission code',
      );
    });

    it('should throw for 5-level codes', () => {
      expect(() => parsePermissionCode('a.b.c.d.e')).toThrow(
        'Invalid permission code',
      );
    });

    it('should throw for 1-level codes', () => {
      expect(() => parsePermissionCode('stock')).toThrow(
        'Invalid permission code',
      );
    });
  });
});
