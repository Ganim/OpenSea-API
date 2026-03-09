import { Tenant } from '@/entities/core/tenant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CreateTenantSchema,
  TenantsListFilters,
  TenantsRepository,
  UpdateTenantSchema,
} from '../tenants-repository';

export class PrismaTenantsRepository implements TenantsRepository {
  async create(data: CreateTenantSchema): Promise<Tenant> {
    const tenantDb = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl ?? null,
        status: data.status ?? 'ACTIVE',
        settings: (data.settings ?? {}) as Prisma.InputJsonValue,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return Tenant.create(
      {
        name: tenantDb.name,
        slug: tenantDb.slug,
        logoUrl: tenantDb.logoUrl,
        status: tenantDb.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        settings: (tenantDb.settings as Record<string, unknown>) ?? {},
        metadata: (tenantDb.metadata as Record<string, unknown>) ?? {},
        deletedAt: tenantDb.deletedAt,
        createdAt: tenantDb.createdAt,
        updatedAt: tenantDb.updatedAt,
      },
      new UniqueEntityID(tenantDb.id),
    );
  }

  async update(data: UpdateTenantSchema): Promise<Tenant | null> {
    const existing = await prisma.tenant.findUnique({
      where: { id: data.id.toString() },
    });
    if (!existing) return null;

    const tenantDb = await prisma.tenant.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settings !== undefined && {
          settings: data.settings as Prisma.InputJsonValue,
        }),
        ...(data.metadata !== undefined && {
          metadata: data.metadata as Prisma.InputJsonValue,
        }),
      },
    });

    return Tenant.create(
      {
        name: tenantDb.name,
        slug: tenantDb.slug,
        logoUrl: tenantDb.logoUrl,
        status: tenantDb.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        settings: (tenantDb.settings as Record<string, unknown>) ?? {},
        metadata: (tenantDb.metadata as Record<string, unknown>) ?? {},
        deletedAt: tenantDb.deletedAt,
        createdAt: tenantDb.createdAt,
        updatedAt: tenantDb.updatedAt,
      },
      new UniqueEntityID(tenantDb.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.tenant.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async findById(id: UniqueEntityID): Promise<Tenant | null> {
    const tenantDb = await prisma.tenant.findFirst({
      where: { id: id.toString(), deletedAt: null },
    });
    if (!tenantDb) return null;

    return Tenant.create(
      {
        name: tenantDb.name,
        slug: tenantDb.slug,
        logoUrl: tenantDb.logoUrl,
        status: tenantDb.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        settings: (tenantDb.settings as Record<string, unknown>) ?? {},
        metadata: (tenantDb.metadata as Record<string, unknown>) ?? {},
        deletedAt: tenantDb.deletedAt,
        createdAt: tenantDb.createdAt,
        updatedAt: tenantDb.updatedAt,
      },
      new UniqueEntityID(tenantDb.id),
    );
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenantDb = await prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!tenantDb) return null;

    return Tenant.create(
      {
        name: tenantDb.name,
        slug: tenantDb.slug,
        logoUrl: tenantDb.logoUrl,
        status: tenantDb.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        settings: (tenantDb.settings as Record<string, unknown>) ?? {},
        metadata: (tenantDb.metadata as Record<string, unknown>) ?? {},
        deletedAt: tenantDb.deletedAt,
        createdAt: tenantDb.createdAt,
        updatedAt: tenantDb.updatedAt,
      },
      new UniqueEntityID(tenantDb.id),
    );
  }

  private buildWhereClause(filters?: TenantsListFilters): Prisma.TenantWhereInput {
    const where: Prisma.TenantWhereInput = { deletedAt: null };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    }

    return where;
  }

  async findMany(
    page: number,
    perPage: number,
    filters?: TenantsListFilters,
  ): Promise<Tenant[]> {
    const where = this.buildWhereClause(filters);

    const tenantsDb = await prisma.tenant.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return tenantsDb.map((t) =>
      Tenant.create(
        {
          name: t.name,
          slug: t.slug,
          logoUrl: t.logoUrl,
          status: t.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
          settings: (t.settings as Record<string, unknown>) ?? {},
          metadata: (t.metadata as Record<string, unknown>) ?? {},
          deletedAt: t.deletedAt,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        },
        new UniqueEntityID(t.id),
      ),
    );
  }

  async countAll(filters?: TenantsListFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return prisma.tenant.count({ where });
  }

  async countByStatus(): Promise<Record<string, number>> {
    const groups = await prisma.tenant.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { deletedAt: null },
    });

    const result: Record<string, number> = {};
    for (const group of groups) {
      result[group.status] = group._count.id;
    }
    return result;
  }

  async countMonthlyGrowth(
    months: number,
  ): Promise<Array<{ month: string; count: number }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw<
      Array<{ month: string; count: bigint }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)::bigint AS count
      FROM tenants
      WHERE created_at >= ${startDate}
        AND deleted_at IS NULL
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    return rows.map((row) => ({
      month: row.month,
      count: Number(row.count),
    }));
  }

  async countTenantsByPlanTier(): Promise<Record<string, number>> {
    const rows = await prisma.$queryRaw<
      Array<{ tier: string; count: bigint }>
    >`
      SELECT p.tier, COUNT(DISTINCT tp.tenant_id)::bigint AS count
      FROM tenant_plans tp
      INNER JOIN plans p ON p.id = tp.plan_id
      INNER JOIN tenants t ON t.id = tp.tenant_id AND t.deleted_at IS NULL
      WHERE p.is_active = true
      GROUP BY p.tier
    `;

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.tier] = Number(row.count);
    }
    return result;
  }

  async countTotalUsers(): Promise<number> {
    return prisma.user.count();
  }

  async calculateMrr(): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ mrr: number | null }>>`
      SELECT COALESCE(SUM(p.price), 0) AS mrr
      FROM tenant_plans tp
      INNER JOIN plans p ON p.id = tp.plan_id AND p.is_active = true
      INNER JOIN tenants t ON t.id = tp.tenant_id
        AND t.deleted_at IS NULL
        AND t.status = 'ACTIVE'
    `;
    return Number(result[0]?.mrr ?? 0);
  }
}
