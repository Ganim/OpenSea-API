import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

export interface StockSnapshot {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  totalCategories: number;
  recentMovements: number;
}

export interface FinanceSnapshot {
  totalReceivable: number;
  totalPayable: number;
  overdueCount: number;
  monthRevenue: number;
  monthExpenses: number;
}

export interface HrSnapshot {
  totalEmployees: number;
  activeCount: number;
  onVacation: number;
  departmentCount: number;
}

export interface SalesSnapshot {
  totalOrders: number;
  monthOrders: number;
  monthRevenue: number;
  openOrders: number;
  totalCustomers: number;
}

export interface ModuleSnapshot {
  stock?: StockSnapshot;
  finance?: FinanceSnapshot;
  hr?: HrSnapshot;
  sales?: SalesSnapshot;
}

export interface TenantSnapshot {
  tenantId: string;
  generatedAt: string;
  modules: ModuleSnapshot;
}

const CACHE_KEY_PREFIX = 'atlas:snapshot:';
const CACHE_TTL_SECONDS = 3600; // 1 hour

export class BusinessSnapshotService {
  async generate(tenantId: string): Promise<TenantSnapshot> {
    const [stock, finance, hr, sales] = await Promise.allSettled([
      this.generateStockSnapshot(tenantId),
      this.generateFinanceSnapshot(tenantId),
      this.generateHrSnapshot(tenantId),
      this.generateSalesSnapshot(tenantId),
    ]);

    const snapshot: TenantSnapshot = {
      tenantId,
      generatedAt: new Date().toISOString(),
      modules: {
        stock: stock.status === 'fulfilled' ? stock.value : undefined,
        finance: finance.status === 'fulfilled' ? finance.value : undefined,
        hr: hr.status === 'fulfilled' ? hr.value : undefined,
        sales: sales.status === 'fulfilled' ? sales.value : undefined,
      },
    };

    // Cache in Redis
    const redis = getRedisClient();
    await redis.set(
      `${CACHE_KEY_PREFIX}${tenantId}`,
      JSON.stringify(snapshot),
      'EX',
      CACHE_TTL_SECONDS,
    );

    return snapshot;
  }

  async getCached(tenantId: string): Promise<TenantSnapshot | null> {
    const redis = getRedisClient();
    const data = await redis.get(`${CACHE_KEY_PREFIX}${tenantId}`);
    return data ? JSON.parse(data) : null;
  }

  async getOrGenerate(tenantId: string): Promise<TenantSnapshot> {
    const cached = await this.getCached(tenantId);
    if (cached) return cached;
    return this.generate(tenantId);
  }

  async invalidate(tenantId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${CACHE_KEY_PREFIX}${tenantId}`);
  }

  /** Filter snapshot to only include modules user has permission for */
  filterByPermissions(
    snapshot: TenantSnapshot,
    permissions: string[],
  ): TenantSnapshot {
    const hasModule = (prefix: string) =>
      permissions.some((p) => p.startsWith(prefix));

    return {
      ...snapshot,
      modules: {
        stock: hasModule('stock.') ? snapshot.modules.stock : undefined,
        finance: hasModule('finance.') ? snapshot.modules.finance : undefined,
        hr: hasModule('hr.') ? snapshot.modules.hr : undefined,
        sales: hasModule('sales.') ? snapshot.modules.sales : undefined,
      },
    };
  }

  // --- Private generators per module ---

  private async generateStockSnapshot(
    tenantId: string,
  ): Promise<StockSnapshot> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalProducts,
      activeProducts,
      totalCategories,
      recentMovements,
      lowStockItems,
    ] = await Promise.all([
      prisma.product.count({
        where: { tenantId, deletedAt: null },
      }),
      prisma.product.count({
        where: { tenantId, deletedAt: null, status: 'ACTIVE' },
      }),
      prisma.category.count({
        where: { tenantId, deletedAt: null },
      }),
      prisma.itemMovement.count({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
      }),
      // Items with currentQuantity <= 0 (low stock / out of stock)
      prisma.item.count({
        where: {
          tenantId,
          deletedAt: null,
          currentQuantity: { lte: 0 },
          status: 'AVAILABLE',
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      lowStockCount: lowStockItems,
      totalCategories,
      recentMovements,
    };
  }

  private async generateFinanceSnapshot(
    tenantId: string,
  ): Promise<FinanceSnapshot> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [
      totalReceivable,
      totalPayable,
      overdueCount,
      monthReceivedAgg,
      monthPaidAgg,
    ] = await Promise.all([
      prisma.financeEntry.count({
        where: {
          tenantId,
          type: 'RECEIVABLE',
          status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] },
        },
      }),
      prisma.financeEntry.count({
        where: {
          tenantId,
          type: 'PAYABLE',
          status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] },
        },
      }),
      prisma.financeEntry.count({
        where: {
          tenantId,
          status: 'OVERDUE',
        },
      }),
      // Month revenue: sum of received entries' actualAmount
      prisma.financeEntry.aggregate({
        where: {
          tenantId,
          type: 'RECEIVABLE',
          status: { in: ['RECEIVED', 'PAID'] },
          paymentDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { actualAmount: true },
      }),
      // Month expenses: sum of paid entries' actualAmount
      prisma.financeEntry.aggregate({
        where: {
          tenantId,
          type: 'PAYABLE',
          status: 'PAID',
          paymentDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { actualAmount: true },
      }),
    ]);

    return {
      totalReceivable,
      totalPayable,
      overdueCount,
      monthRevenue: Number(monthReceivedAgg._sum.actualAmount ?? 0),
      monthExpenses: Number(monthPaidAgg._sum.actualAmount ?? 0),
    };
  }

  private async generateHrSnapshot(tenantId: string): Promise<HrSnapshot> {
    const [totalEmployees, activeCount, onVacation, departmentCount] =
      await Promise.all([
        prisma.employee.count({
          where: { tenantId, deletedAt: null },
        }),
        prisma.employee.count({
          where: { tenantId, deletedAt: null, status: 'ACTIVE' },
        }),
        prisma.employee.count({
          where: { tenantId, deletedAt: null, status: 'VACATION' },
        }),
        prisma.department.count({
          where: { tenantId, deletedAt: null, isActive: true },
        }),
      ]);

    return {
      totalEmployees,
      activeCount,
      onVacation,
      departmentCount,
    };
  }

  private async generateSalesSnapshot(
    tenantId: string,
  ): Promise<SalesSnapshot> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [
      totalOrders,
      monthOrders,
      monthRevenueAgg,
      openOrders,
      totalCustomers,
    ] = await Promise.all([
      prisma.order.count({
        where: { tenantId, deletedAt: null, type: 'ORDER' },
      }),
      prisma.order.count({
        where: {
          tenantId,
          deletedAt: null,
          type: 'ORDER',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.order.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          type: 'ORDER',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { grandTotal: true },
      }),
      // Open orders: not yet delivered/cancelled
      prisma.order.count({
        where: {
          tenantId,
          deletedAt: null,
          type: 'ORDER',
          deliveredAt: null,
          cancelledAt: null,
        },
      }),
      prisma.customer.count({
        where: { tenantId, deletedAt: null },
      }),
    ]);

    return {
      totalOrders,
      monthOrders,
      monthRevenue: Number(monthRevenueAgg._sum.grandTotal ?? 0),
      openOrders,
      totalCustomers,
    };
  }
}
