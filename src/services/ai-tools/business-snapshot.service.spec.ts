import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BusinessSnapshotService,
  type TenantSnapshot,
} from './business-snapshot.service';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { count: vi.fn().mockResolvedValue(0) },
    category: { count: vi.fn().mockResolvedValue(0) },
    itemMovement: { count: vi.fn().mockResolvedValue(0) },
    item: { count: vi.fn().mockResolvedValue(0) },
    financeEntry: {
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { actualAmount: null } }),
    },
    employee: { count: vi.fn().mockResolvedValue(0) },
    department: { count: vi.fn().mockResolvedValue(0) },
    order: {
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { grandTotal: null } }),
    },
    customer: { count: vi.fn().mockResolvedValue(0) },
  },
}));

// Mock redis
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisDel = vi.fn();

vi.mock('@/lib/redis', () => ({
  getRedisClient: () => ({
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
  }),
}));

describe('BusinessSnapshotService', () => {
  let service: BusinessSnapshotService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue('OK');
    mockRedisDel.mockResolvedValue(1);
    service = new BusinessSnapshotService();
  });

  describe('filterByPermissions', () => {
    const fullSnapshot: TenantSnapshot = {
      tenantId: 'tenant-1',
      generatedAt: '2026-03-26T00:00:00.000Z',
      modules: {
        stock: {
          totalProducts: 100,
          activeProducts: 80,
          lowStockCount: 5,
          totalCategories: 10,
          recentMovements: 50,
        },
        finance: {
          totalReceivable: 20,
          totalPayable: 15,
          overdueCount: 3,
          monthRevenue: 50000,
          monthExpenses: 30000,
        },
        hr: {
          totalEmployees: 50,
          activeCount: 45,
          onVacation: 2,
          departmentCount: 8,
        },
        sales: {
          totalOrders: 200,
          monthOrders: 30,
          monthRevenue: 120000,
          openOrders: 10,
          totalCustomers: 150,
        },
      },
    };

    it('should return only stock when user has stock permissions', () => {
      const result = service.filterByPermissions(fullSnapshot, [
        'stock.products.access',
        'stock.products.register',
      ]);

      expect(result.modules.stock).toBeDefined();
      expect(result.modules.finance).toBeUndefined();
      expect(result.modules.hr).toBeUndefined();
      expect(result.modules.sales).toBeUndefined();
    });

    it('should return all modules when user has all permissions', () => {
      const result = service.filterByPermissions(fullSnapshot, [
        'stock.products.access',
        'finance.entries.access',
        'hr.employees.access',
        'sales.orders.access',
      ]);

      expect(result.modules.stock).toBeDefined();
      expect(result.modules.finance).toBeDefined();
      expect(result.modules.hr).toBeDefined();
      expect(result.modules.sales).toBeDefined();
    });

    it('should return empty modules when user has no permissions', () => {
      const result = service.filterByPermissions(fullSnapshot, []);

      expect(result.modules.stock).toBeUndefined();
      expect(result.modules.finance).toBeUndefined();
      expect(result.modules.hr).toBeUndefined();
      expect(result.modules.sales).toBeUndefined();
    });

    it('should return stock and finance for mixed permissions', () => {
      const result = service.filterByPermissions(fullSnapshot, [
        'stock.categories.access',
        'finance.entries.modify',
      ]);

      expect(result.modules.stock).toBeDefined();
      expect(result.modules.finance).toBeDefined();
      expect(result.modules.hr).toBeUndefined();
      expect(result.modules.sales).toBeUndefined();
    });

    it('should preserve tenantId and generatedAt', () => {
      const result = service.filterByPermissions(fullSnapshot, []);

      expect(result.tenantId).toBe('tenant-1');
      expect(result.generatedAt).toBe('2026-03-26T00:00:00.000Z');
    });
  });

  describe('generate', () => {
    it('should return a valid snapshot structure', async () => {
      const snapshot = await service.generate('tenant-1');

      expect(snapshot.tenantId).toBe('tenant-1');
      expect(snapshot.generatedAt).toBeDefined();
      expect(snapshot.modules).toBeDefined();
    });

    it('should cache snapshot in Redis after generation', async () => {
      await service.generate('tenant-1');

      expect(mockRedisSet).toHaveBeenCalledWith(
        'atlas:snapshot:tenant-1',
        expect.any(String),
        'EX',
        3600,
      );
    });

    it('should return modules even when all counts are zero', async () => {
      const snapshot = await service.generate('tenant-1');

      expect(snapshot.modules.stock).toEqual({
        totalProducts: 0,
        activeProducts: 0,
        lowStockCount: 0,
        totalCategories: 0,
        recentMovements: 0,
      });

      expect(snapshot.modules.finance).toEqual({
        totalReceivable: 0,
        totalPayable: 0,
        overdueCount: 0,
        monthRevenue: 0,
        monthExpenses: 0,
      });

      expect(snapshot.modules.hr).toEqual({
        totalEmployees: 0,
        activeCount: 0,
        onVacation: 0,
        departmentCount: 0,
      });

      expect(snapshot.modules.sales).toEqual({
        totalOrders: 0,
        monthOrders: 0,
        monthRevenue: 0,
        openOrders: 0,
        totalCustomers: 0,
      });
    });
  });

  describe('getCached', () => {
    it('should return null when no cache exists', async () => {
      mockRedisGet.mockResolvedValue(null);
      const result = await service.getCached('tenant-1');
      expect(result).toBeNull();
    });

    it('should return parsed snapshot from Redis', async () => {
      const cached: TenantSnapshot = {
        tenantId: 'tenant-1',
        generatedAt: '2026-03-26T00:00:00.000Z',
        modules: {
          stock: {
            totalProducts: 10,
            activeProducts: 8,
            lowStockCount: 1,
            totalCategories: 3,
            recentMovements: 5,
          },
        },
      };
      mockRedisGet.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getCached('tenant-1');
      expect(result).toEqual(cached);
      expect(mockRedisGet).toHaveBeenCalledWith('atlas:snapshot:tenant-1');
    });
  });

  describe('getOrGenerate', () => {
    it('should return cached snapshot when available', async () => {
      const cached: TenantSnapshot = {
        tenantId: 'tenant-1',
        generatedAt: '2026-03-26T00:00:00.000Z',
        modules: {},
      };
      mockRedisGet.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getOrGenerate('tenant-1');
      expect(result).toEqual(cached);
      // Should NOT have set new data
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it('should generate fresh snapshot when no cache exists', async () => {
      mockRedisGet.mockResolvedValue(null);

      const result = await service.getOrGenerate('tenant-1');
      expect(result.tenantId).toBe('tenant-1');
      expect(mockRedisSet).toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('should delete the Redis cache key', async () => {
      await service.invalidate('tenant-1');
      expect(mockRedisDel).toHaveBeenCalledWith('atlas:snapshot:tenant-1');
    });
  });

  describe('resilience', () => {
    it('should return undefined for a module that throws', async () => {
      const { prisma } = await import('@/lib/prisma');
      // Make stock queries fail
      (prisma.product.count as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('DB connection lost'),
      );

      const snapshot = await service.generate('tenant-1');

      // Stock should be undefined (failed), others should still be present
      expect(snapshot.modules.stock).toBeUndefined();
      expect(snapshot.modules.finance).toBeDefined();
      expect(snapshot.modules.hr).toBeDefined();
      expect(snapshot.modules.sales).toBeDefined();
    });
  });
});
