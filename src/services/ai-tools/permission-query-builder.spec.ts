import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma to avoid env validation during unit tests
vi.mock('@/lib/prisma', () => ({
  prisma: {},
  Prisma: {},
}));

import { PermissionAwareQueryBuilder } from './permission-query-builder';

describe('PermissionAwareQueryBuilder', () => {
  let builder: PermissionAwareQueryBuilder;

  beforeEach(() => {
    builder = new PermissionAwareQueryBuilder();
  });

  describe('validatePermissions()', () => {
    it('should return valid when user has all required permissions', () => {
      const permissions = [
        'stock.products.access',
        'finance.entries.access',
        'hr.employees.access',
      ];

      const result = builder.validatePermissions(
        ['stock', 'finance', 'hr'],
        permissions,
      );

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should return invalid with missing permissions when user lacks some', () => {
      const permissions = ['stock.products.access'];

      const result = builder.validatePermissions(
        ['stock', 'finance'],
        permissions,
      );

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(['finance.entries.access']);
    });

    it('should return all missing when user has no matching permissions', () => {
      const permissions = ['admin.users.access'];

      const result = builder.validatePermissions(
        ['stock', 'finance', 'hr'],
        permissions,
      );

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(3);
      expect(result.missing).toContain('stock.products.access');
      expect(result.missing).toContain('finance.entries.access');
      expect(result.missing).toContain('hr.employees.access');
    });

    it('should return valid for empty modules array', () => {
      const result = builder.validatePermissions([], []);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should handle single module validation', () => {
      const result = builder.validatePermissions(
        ['sales'],
        ['sales.orders.access'],
      );

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('getDefaultEntity()', () => {
    it('should return "products" for stock module', () => {
      expect(builder.getDefaultEntity('stock')).toBe('products');
    });

    it('should return "entries" for finance module', () => {
      expect(builder.getDefaultEntity('finance')).toBe('entries');
    });

    it('should return "employees" for hr module', () => {
      expect(builder.getDefaultEntity('hr')).toBe('employees');
    });

    it('should return "orders" for sales module', () => {
      expect(builder.getDefaultEntity('sales')).toBe('orders');
    });

    it('should return "access" for unknown modules', () => {
      expect(builder.getDefaultEntity('unknown')).toBe('access');
      expect(builder.getDefaultEntity('tools')).toBe('access');
    });
  });

  describe('searchEntities()', () => {
    it('should return missing permissions when user lacks access', async () => {
      const result = await builder.searchEntities(
        { query: 'test', modules: ['stock', 'finance'] },
        'tenant-1',
        ['stock.products.access'],
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
      expect(result.missingPermissions).toEqual(['finance.entries.access']);
    });
  });

  describe('getKpis()', () => {
    it('should return missing permissions when user lacks access', async () => {
      const result = await builder.getKpis(
        { modules: ['hr', 'sales'] },
        'tenant-1',
        ['hr.employees.access'],
      );

      expect(result.success).toBe(false);
      expect(result.missingPermissions).toEqual(['sales.orders.access']);
    });
  });

  describe('crossModuleQuery()', () => {
    it('should return missing permissions for both modules', async () => {
      const result = await builder.crossModuleQuery(
        {
          primaryModule: 'stock',
          secondaryModule: 'sales',
          queryType: 'top_by_metric',
          metric: 'revenue',
        },
        'tenant-1',
        [],
      );

      expect(result.success).toBe(false);
      expect(result.missingPermissions).toHaveLength(2);
      expect(result.missingPermissions).toContain('stock.products.access');
      expect(result.missingPermissions).toContain('sales.orders.access');
    });

    it('should return missing permission when only one module is accessible', async () => {
      const result = await builder.crossModuleQuery(
        {
          primaryModule: 'stock',
          secondaryModule: 'sales',
          queryType: 'top_by_metric',
          metric: 'revenue',
        },
        'tenant-1',
        ['stock.products.access'],
      );

      expect(result.success).toBe(false);
      expect(result.missingPermissions).toEqual(['sales.orders.access']);
    });
  });
});
