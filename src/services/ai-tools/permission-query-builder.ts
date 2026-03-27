import { prisma } from '@/lib/prisma';

// === Interfaces ===

export interface QueryResult {
  success: boolean;
  data?: unknown;
  error?: string;
  missingPermissions?: string[];
}

export interface SearchEntitiesParams {
  query: string;
  modules: string[];
  entityTypes?: string[];
  limit?: number;
}

export interface GetKpisParams {
  modules: string[];
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
}

export interface CrossModuleQueryParams {
  primaryModule: string;
  secondaryModule: string;
  queryType: 'top_by_metric' | 'correlation' | 'breakdown';
  metric: string;
  groupBy?: string;
  limit?: number;
  period?: string;
}

// === Module/Entity Configuration ===

interface EntitySearchConfig {
  model: string;
  searchFields: string[];
  selectFields: Record<string, boolean>;
  labelField: string;
}

const MODULE_ENTITY_MAP: Record<string, Record<string, EntitySearchConfig>> = {
  stock: {
    products: {
      model: 'product',
      searchFields: ['name', 'description', 'fullCode'],
      selectFields: {
        id: true,
        name: true,
        fullCode: true,
        status: true,
        createdAt: true,
      },
      labelField: 'name',
    },
    customers: {
      model: 'customer',
      searchFields: ['name', 'email', 'phone'],
      selectFields: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      labelField: 'name',
    },
  },
  finance: {
    entries: {
      model: 'financeEntry',
      searchFields: ['description', 'code', 'supplierName', 'customerName'],
      selectFields: {
        id: true,
        code: true,
        description: true,
        type: true,
        expectedAmount: true,
        dueDate: true,
        status: true,
        createdAt: true,
      },
      labelField: 'description',
    },
  },
  hr: {
    employees: {
      model: 'employee',
      searchFields: ['fullName', 'registrationNumber', 'cpf'],
      selectFields: {
        id: true,
        fullName: true,
        registrationNumber: true,
        status: true,
        createdAt: true,
      },
      labelField: 'fullName',
    },
  },
  sales: {
    orders: {
      model: 'salesOrder',
      searchFields: ['orderNumber', 'notes'],
      selectFields: {
        id: true,
        orderNumber: true,
        status: true,
        totalPrice: true,
        finalPrice: true,
        createdAt: true,
      },
      labelField: 'orderNumber',
    },
  },
};

// === Date range helpers ===

function getDateRange(period: string): { gte: Date; lt: Date } {
  const now = new Date();
  const lt = new Date(now);
  lt.setHours(23, 59, 59, 999);

  const gte = new Date(now);
  gte.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      break;
    case 'week':
      gte.setDate(gte.getDate() - 7);
      break;
    case 'month':
      gte.setMonth(gte.getMonth() - 1);
      break;
    case 'quarter':
      gte.setMonth(gte.getMonth() - 3);
      break;
    case 'year':
      gte.setFullYear(gte.getFullYear() - 1);
      break;
    default:
      gte.setMonth(gte.getMonth() - 1);
  }

  return { gte, lt };
}

function getPreviousDateRange(period: string): { gte: Date; lt: Date } {
  const current = getDateRange(period);
  const durationMs = current.lt.getTime() - current.gte.getTime();

  return {
    gte: new Date(current.gte.getTime() - durationMs),
    lt: new Date(current.gte.getTime()),
  };
}

// === PermissionAwareQueryBuilder ===

export class PermissionAwareQueryBuilder {
  /**
   * Validates that the user has the required permissions for the requested modules.
   */
  validatePermissions(
    modules: string[],
    permissions: string[],
  ): { valid: boolean; missing: string[] } {
    const permSet = new Set(permissions);
    const requiredPerms = modules.map(
      (m) => `${m}.${this.getDefaultEntity(m)}.access`,
    );
    const missing = requiredPerms.filter((p) => !permSet.has(p));
    return { valid: missing.length === 0, missing };
  }

  /**
   * Returns the default entity name for a module (used for permission checks).
   */
  getDefaultEntity(module: string): string {
    const map: Record<string, string> = {
      stock: 'products',
      finance: 'entries',
      hr: 'employees',
      sales: 'orders',
    };
    return map[module] ?? 'access';
  }

  /**
   * Search entities across modules using Prisma `contains` text search.
   * Only searches modules the user has permissions for.
   */
  async searchEntities(
    params: SearchEntitiesParams,
    tenantId: string,
    permissions: string[],
  ): Promise<QueryResult> {
    const { query, modules, entityTypes, limit = 20 } = params;

    const validation = this.validatePermissions(modules, permissions);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Insufficient permissions to search the requested modules.',
        missingPermissions: validation.missing,
      };
    }

    const clampedLimit = Math.min(Math.max(limit, 1), 50);
    const results: Array<{
      module: string;
      entity: string;
      items: unknown[];
    }> = [];

    for (const mod of modules) {
      const entities = MODULE_ENTITY_MAP[mod];
      if (!entities) continue;

      const entityNames = entityTypes?.length
        ? entityTypes.filter((e) => entities[e])
        : Object.keys(entities);

      for (const entityName of entityNames) {
        const config = entities[entityName];
        if (!config) continue;

        const orConditions = config.searchFields.map((field) => ({
          [field]: { contains: query, mode: 'insensitive' as const },
        }));

        try {
          const modelDelegate = (prisma as unknown as Record<string, unknown>)[
            config.model
          ] as {
            findMany: (args: unknown) => Promise<unknown[]>;
          };

          if (!modelDelegate?.findMany) continue;

          const items = await modelDelegate.findMany({
            where: {
              tenantId,
              deletedAt: null,
              OR: orConditions,
            },
            select: config.selectFields,
            take: clampedLimit,
            orderBy: { createdAt: 'desc' },
          });

          if (items.length > 0) {
            results.push({ module: mod, entity: entityName, items });
          }
        } catch {
          // Skip models that fail (e.g., missing fields in specific schemas)
          continue;
        }
      }
    }

    return {
      success: true,
      data: {
        query,
        totalResults: results.reduce((sum, r) => sum + r.items.length, 0),
        results,
      },
    };
  }

  /**
   * Get KPIs for the requested modules. Uses direct Prisma queries.
   */
  async getKpis(
    params: GetKpisParams,
    tenantId: string,
    permissions: string[],
  ): Promise<QueryResult> {
    const { modules, period = 'month', compareWithPrevious = false } = params;

    const validation = this.validatePermissions(modules, permissions);
    if (!validation.valid) {
      return {
        success: false,
        error:
          'Insufficient permissions to view KPIs for the requested modules.',
        missingPermissions: validation.missing,
      };
    }

    const dateRange = getDateRange(period);
    const kpis: Record<string, unknown> = {};

    for (const mod of modules) {
      try {
        const moduleKpis = await this.getModuleKpis(
          mod,
          tenantId,
          dateRange,
          compareWithPrevious ? getPreviousDateRange(period) : undefined,
        );
        kpis[mod] = moduleKpis;
      } catch {
        kpis[mod] = { error: 'Failed to fetch KPIs for this module.' };
      }
    }

    return {
      success: true,
      data: { period, kpis },
    };
  }

  /**
   * Execute a cross-module query (e.g., top products by sales).
   * Validates permissions for BOTH modules.
   */
  async crossModuleQuery(
    params: CrossModuleQueryParams,
    tenantId: string,
    permissions: string[],
  ): Promise<QueryResult> {
    const {
      primaryModule,
      secondaryModule,
      queryType,
      metric,
      limit = 10,
    } = params;

    const validation = this.validatePermissions(
      [primaryModule, secondaryModule],
      permissions,
    );
    if (!validation.valid) {
      return {
        success: false,
        error:
          'Insufficient permissions. Cross-module queries require access to both modules.',
        missingPermissions: validation.missing,
      };
    }

    const clampedLimit = Math.min(Math.max(limit, 1), 50);

    try {
      const data = await this.executeCrossModuleQuery(
        primaryModule,
        secondaryModule,
        queryType,
        metric,
        tenantId,
        clampedLimit,
      );

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: `Cross-module query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // === Private helpers ===

  private async getModuleKpis(
    module: string,
    tenantId: string,
    dateRange: { gte: Date; lt: Date },
    previousRange?: { gte: Date; lt: Date },
  ): Promise<Record<string, unknown>> {
    switch (module) {
      case 'stock':
        return this.getStockKpis(tenantId, dateRange, previousRange);
      case 'finance':
        return this.getFinanceKpis(tenantId, dateRange, previousRange);
      case 'hr':
        return this.getHrKpis(tenantId);
      case 'sales':
        return this.getSalesKpis(tenantId, dateRange, previousRange);
      default:
        return { message: `No KPIs available for module: ${module}` };
    }
  }

  private async getStockKpis(
    tenantId: string,
    dateRange: { gte: Date; lt: Date },
    previousRange?: { gte: Date; lt: Date },
  ): Promise<Record<string, unknown>> {
    const [totalProducts, activeProducts, newProducts] = await Promise.all([
      prisma.product.count({ where: { tenantId, deletedAt: null } }),
      prisma.product.count({
        where: { tenantId, deletedAt: null, status: 'ACTIVE' },
      }),
      prisma.product.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: dateRange.gte, lt: dateRange.lt },
        },
      }),
    ]);

    const kpis: Record<string, unknown> = {
      totalProducts,
      activeProducts,
      newProducts,
    };

    if (previousRange) {
      const prevNew = await prisma.product.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: previousRange.gte, lt: previousRange.lt },
        },
      });
      kpis.previousNewProducts = prevNew;
    }

    return kpis;
  }

  private async getFinanceKpis(
    tenantId: string,
    dateRange: { gte: Date; lt: Date },
    previousRange?: { gte: Date; lt: Date },
  ): Promise<Record<string, unknown>> {
    const [totalEntries, pendingEntries, overdueEntries] = await Promise.all([
      prisma.financeEntry.count({
        where: {
          tenantId,
          createdAt: { gte: dateRange.gte, lt: dateRange.lt },
        },
      }),
      prisma.financeEntry.count({
        where: { tenantId, status: 'PENDING' },
      }),
      prisma.financeEntry.count({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const kpis: Record<string, unknown> = {
      totalEntries,
      pendingEntries,
      overdueEntries,
    };

    if (previousRange) {
      const prevTotal = await prisma.financeEntry.count({
        where: {
          tenantId,
          createdAt: { gte: previousRange.gte, lt: previousRange.lt },
        },
      });
      kpis.previousTotalEntries = prevTotal;
    }

    return kpis;
  }

  private async getHrKpis(tenantId: string): Promise<Record<string, unknown>> {
    const [totalEmployees, activeEmployees] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    return { totalEmployees, activeEmployees };
  }

  private async getSalesKpis(
    tenantId: string,
    dateRange: { gte: Date; lt: Date },
    previousRange?: { gte: Date; lt: Date },
  ): Promise<Record<string, unknown>> {
    const [totalOrders, pendingOrders] = await Promise.all([
      prisma.salesOrder.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: dateRange.gte, lt: dateRange.lt },
        },
      }),
      prisma.salesOrder.count({
        where: { tenantId, deletedAt: null, status: 'PENDING' },
      }),
    ]);

    const kpis: Record<string, unknown> = {
      totalOrders,
      pendingOrders,
    };

    if (previousRange) {
      const prevTotal = await prisma.salesOrder.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: previousRange.gte, lt: previousRange.lt },
        },
      });
      kpis.previousTotalOrders = prevTotal;
    }

    return kpis;
  }

  private async executeCrossModuleQuery(
    primaryModule: string,
    secondaryModule: string,
    queryType: string,
    metric: string,
    tenantId: string,
    limit: number,
  ): Promise<unknown> {
    // Predefined join patterns for common cross-module queries
    const queryKey = `${primaryModule}+${secondaryModule}:${queryType}:${metric}`;

    switch (queryKey) {
      case 'stock+sales:top_by_metric:revenue':
        return this.topProductsByRevenue(tenantId, limit);

      case 'stock+sales:top_by_metric:quantity':
        return this.topProductsByQuantity(tenantId, limit);

      case 'sales+finance:correlation:payment_rate':
        return this.salesPaymentCorrelation(tenantId, limit);

      case 'sales+stock:breakdown:order_items':
        return this.salesOrderItemsBreakdown(tenantId, limit);

      default:
        return {
          message: `No predefined query pattern for: ${queryKey}. Available patterns: stock+sales (revenue, quantity), sales+finance (payment_rate), sales+stock (order_items).`,
          availablePatterns: [
            'stock+sales:top_by_metric:revenue',
            'stock+sales:top_by_metric:quantity',
            'sales+finance:correlation:payment_rate',
            'sales+stock:breakdown:order_items',
          ],
        };
    }
  }

  private async topProductsByRevenue(
    tenantId: string,
    limit: number,
  ): Promise<unknown> {
    const items = await prisma.salesOrderItem.findMany({
      where: {
        order: { tenantId, deletedAt: null },
      },
      select: {
        quantity: true,
        totalPrice: true,
        variant: {
          select: { id: true, name: true, sku: true },
        },
      },
      orderBy: { totalPrice: 'desc' },
      take: limit,
    });

    return {
      queryType: 'top_by_metric',
      metric: 'revenue',
      items: items.map((i) => ({
        variantName: i.variant.name,
        sku: i.variant.sku,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
    };
  }

  private async topProductsByQuantity(
    tenantId: string,
    limit: number,
  ): Promise<unknown> {
    const items = await prisma.salesOrderItem.findMany({
      where: {
        order: { tenantId, deletedAt: null },
      },
      select: {
        quantity: true,
        totalPrice: true,
        variant: {
          select: { id: true, name: true, sku: true },
        },
      },
      orderBy: { quantity: 'desc' },
      take: limit,
    });

    return {
      queryType: 'top_by_metric',
      metric: 'quantity',
      items: items.map((i) => ({
        variantName: i.variant.name,
        sku: i.variant.sku,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
    };
  }

  private async salesPaymentCorrelation(
    tenantId: string,
    limit: number,
  ): Promise<unknown> {
    const orders = await prisma.salesOrder.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        finalPrice: true,
        status: true,
        customer: { select: { name: true } },
      },
      orderBy: { finalPrice: 'desc' },
      take: limit,
    });

    return {
      queryType: 'correlation',
      metric: 'payment_rate',
      orders,
    };
  }

  private async salesOrderItemsBreakdown(
    tenantId: string,
    limit: number,
  ): Promise<unknown> {
    const orders = await prisma.salesOrder.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        orderNumber: true,
        status: true,
        finalPrice: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            variant: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      queryType: 'breakdown',
      metric: 'order_items',
      orders,
    };
  }
}
