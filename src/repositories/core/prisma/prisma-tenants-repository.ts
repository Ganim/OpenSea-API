import { Tenant } from '@/entities/core/tenant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CreateTenantSchema,
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

  async findMany(page: number, perPage: number): Promise<Tenant[]> {
    const tenantsDb = await prisma.tenant.findMany({
      where: { deletedAt: null },
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

  async countAll(): Promise<number> {
    return prisma.tenant.count({ where: { deletedAt: null } });
  }
}
