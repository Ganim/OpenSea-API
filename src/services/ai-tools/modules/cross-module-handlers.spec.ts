import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCrossModuleHandlers } from './cross-module-handlers';
import type { ToolExecutionContext } from '../tool-types';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    customer: { findMany: vi.fn().mockResolvedValue([]) },
    financeEntry: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { actualAmount: 0 } }),
    },
    employee: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    salesOrder: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    salesOrderItem: { findMany: vi.fn().mockResolvedValue([]) },
    item: { count: vi.fn().mockResolvedValue(0) },
    itemMovement: { count: vi.fn().mockResolvedValue(0) },
    category: { count: vi.fn().mockResolvedValue(0) },
    order: {
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { grandTotal: 0 } }),
    },
    department: { count: vi.fn().mockResolvedValue(0) },
  },
}));

// Mock Redis
vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  })),
}));

describe('Cross-module handlers', () => {
  const handlers = getCrossModuleHandlers();

  const baseContext: ToolExecutionContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    permissions: [
      'stock.products.access',
      'finance.entries.access',
      'hr.employees.access',
      'sales.orders.access',
      'system.ai.access',
    ],
    conversationId: 'conv-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- atlas_search_entities ---

  describe('atlas_search_entities', () => {
    it('should be defined', () => {
      expect(handlers.atlas_search_entities).toBeDefined();
    });

    it('should search across all modules when none specified', async () => {
      const result = await handlers.atlas_search_entities.execute(
        { query: 'test' },
        baseContext,
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });

    it('should search only specified modules', async () => {
      const result = await handlers.atlas_search_entities.execute(
        { query: 'widget', modules: ['stock'] },
        baseContext,
      );

      expect(result).toHaveProperty('success', true);
    });

    it('should deny access when permissions are missing', async () => {
      const restrictedContext: ToolExecutionContext = {
        ...baseContext,
        permissions: ['system.ai.access'], // No module permissions
      };

      const result = (await handlers.atlas_search_entities.execute(
        { query: 'test' },
        restrictedContext,
      )) as { success: boolean; missingPermissions?: string[] };

      expect(result.success).toBe(false);
      expect(result.missingPermissions).toBeDefined();
      expect(result.missingPermissions!.length).toBeGreaterThan(0);
    });

    it('should respect entity type filter', async () => {
      const result = await handlers.atlas_search_entities.execute(
        { query: 'test', modules: ['stock'], entityTypes: ['products'] },
        baseContext,
      );

      expect(result).toHaveProperty('success', true);
    });
  });

  // --- atlas_get_business_kpis ---

  describe('atlas_get_business_kpis', () => {
    it('should be defined', () => {
      expect(handlers.atlas_get_business_kpis).toBeDefined();
    });

    it('should return KPIs for all modules with default period', async () => {
      const result = (await handlers.atlas_get_business_kpis.execute(
        {},
        baseContext,
      )) as { success: boolean; data?: { period: string } };

      expect(result.success).toBe(true);
      expect(result.data?.period).toBe('month');
    });

    it('should use specified period', async () => {
      const result = (await handlers.atlas_get_business_kpis.execute(
        { period: 'week' },
        baseContext,
      )) as { success: boolean; data?: { period: string } };

      expect(result.success).toBe(true);
      expect(result.data?.period).toBe('week');
    });

    it('should deny access when permissions are missing', async () => {
      const restrictedContext: ToolExecutionContext = {
        ...baseContext,
        permissions: [],
      };

      const result = (await handlers.atlas_get_business_kpis.execute(
        { modules: ['finance'] },
        restrictedContext,
      )) as { success: boolean; missingPermissions?: string[] };

      expect(result.success).toBe(false);
      expect(result.missingPermissions).toBeDefined();
    });

    it('should only query specified modules', async () => {
      const result = (await handlers.atlas_get_business_kpis.execute(
        { modules: ['stock'], compareWithPrevious: true },
        baseContext,
      )) as { success: boolean; data?: { kpis: Record<string, unknown> } };

      expect(result.success).toBe(true);
      expect(result.data?.kpis).toHaveProperty('stock');
    });
  });

  // --- atlas_cross_module_query ---

  describe('atlas_cross_module_query', () => {
    it('should be defined', () => {
      expect(handlers.atlas_cross_module_query).toBeDefined();
    });

    it('should execute a cross-module query', async () => {
      const result = (await handlers.atlas_cross_module_query.execute(
        {
          primaryModule: 'stock',
          secondaryModule: 'sales',
          queryType: 'top_by_metric',
          metric: 'revenue',
        },
        baseContext,
      )) as { success: boolean };

      expect(result.success).toBe(true);
    });

    it('should deny access when either module permission is missing', async () => {
      const restrictedContext: ToolExecutionContext = {
        ...baseContext,
        permissions: ['stock.products.access'], // Missing sales.orders.access
      };

      const result = (await handlers.atlas_cross_module_query.execute(
        {
          primaryModule: 'stock',
          secondaryModule: 'sales',
          queryType: 'top_by_metric',
          metric: 'revenue',
        },
        restrictedContext,
      )) as { success: boolean; missingPermissions?: string[] };

      expect(result.success).toBe(false);
      expect(result.missingPermissions).toContain('sales.orders.access');
    });

    it('should pass limit parameter through', async () => {
      const result = (await handlers.atlas_cross_module_query.execute(
        {
          primaryModule: 'stock',
          secondaryModule: 'sales',
          queryType: 'top_by_metric',
          metric: 'quantity',
          limit: 5,
        },
        baseContext,
      )) as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  // --- atlas_refresh_snapshot ---

  describe('atlas_refresh_snapshot', () => {
    it('should be defined', () => {
      expect(handlers.atlas_refresh_snapshot).toBeDefined();
    });

    it('should return a snapshot filtered by permissions', async () => {
      const result = (await handlers.atlas_refresh_snapshot.execute(
        {},
        baseContext,
      )) as { success: boolean; data?: { tenantId: string } };

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.tenantId).toBe('tenant-1');
    });

    it('should further filter by requested modules', async () => {
      const result = (await handlers.atlas_refresh_snapshot.execute(
        { includeModules: ['stock'] },
        baseContext,
      )) as { success: boolean; data?: { modules: Record<string, unknown> } };

      expect(result.success).toBe(true);
      // finance, hr, sales should be undefined since only stock was requested
      expect(result.data?.modules.finance).toBeUndefined();
      expect(result.data?.modules.hr).toBeUndefined();
      expect(result.data?.modules.sales).toBeUndefined();
    });

    it('should filter out modules user has no permission for', async () => {
      const restrictedContext: ToolExecutionContext = {
        ...baseContext,
        permissions: ['stock.products.access'], // Only stock permission
      };

      const result = (await handlers.atlas_refresh_snapshot.execute(
        {},
        restrictedContext,
      )) as { success: boolean; data?: { modules: Record<string, unknown> } };

      expect(result.success).toBe(true);
      expect(result.data?.modules.stock).toBeDefined();
      expect(result.data?.modules.finance).toBeUndefined();
      expect(result.data?.modules.hr).toBeUndefined();
      expect(result.data?.modules.sales).toBeUndefined();
    });
  });

  // --- Handler registration completeness ---

  describe('handler registration', () => {
    it('should export exactly 4 handlers', () => {
      expect(Object.keys(handlers)).toHaveLength(4);
    });

    it('should export all expected handler names', () => {
      const names = Object.keys(handlers);
      expect(names).toContain('atlas_search_entities');
      expect(names).toContain('atlas_get_business_kpis');
      expect(names).toContain('atlas_cross_module_query');
      expect(names).toContain('atlas_refresh_snapshot');
    });
  });
});
