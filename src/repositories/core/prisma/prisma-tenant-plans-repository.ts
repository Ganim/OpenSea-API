import { TenantPlan } from '@/entities/core/tenant-plan';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type {
  CreateTenantPlanSchema,
  TenantPlansRepository,
} from '../tenant-plans-repository';

export class PrismaTenantPlansRepository implements TenantPlansRepository {
  async create(data: CreateTenantPlanSchema): Promise<TenantPlan> {
    const tpDb = await prisma.tenantPlan.create({
      data: {
        tenantId: data.tenantId.toString(),
        planId: data.planId.toString(),
        startsAt: data.startsAt ?? new Date(),
        expiresAt: data.expiresAt ?? null,
      },
    });

    return TenantPlan.create(
      {
        tenantId: new UniqueEntityID(tpDb.tenantId),
        planId: new UniqueEntityID(tpDb.planId),
        startsAt: tpDb.startsAt,
        expiresAt: tpDb.expiresAt,
        createdAt: tpDb.createdAt,
        updatedAt: tpDb.updatedAt,
      },
      new UniqueEntityID(tpDb.id),
    );
  }

  async findByTenantId(tenantId: UniqueEntityID): Promise<TenantPlan | null> {
    const tpDb = await prisma.tenantPlan.findFirst({
      where: { tenantId: tenantId.toString() },
      orderBy: { createdAt: 'desc' },
    });
    if (!tpDb) return null;

    return TenantPlan.create(
      {
        tenantId: new UniqueEntityID(tpDb.tenantId),
        planId: new UniqueEntityID(tpDb.planId),
        startsAt: tpDb.startsAt,
        expiresAt: tpDb.expiresAt,
        createdAt: tpDb.createdAt,
        updatedAt: tpDb.updatedAt,
      },
      new UniqueEntityID(tpDb.id),
    );
  }

  async updatePlan(
    tenantId: UniqueEntityID,
    planId: UniqueEntityID,
  ): Promise<TenantPlan | null> {
    const existing = await prisma.tenantPlan.findFirst({
      where: { tenantId: tenantId.toString() },
      orderBy: { createdAt: 'desc' },
    });
    if (!existing) return null;

    const tpDb = await prisma.tenantPlan.update({
      where: { id: existing.id },
      data: {
        planId: planId.toString(),
        startsAt: new Date(),
      },
    });

    return TenantPlan.create(
      {
        tenantId: new UniqueEntityID(tpDb.tenantId),
        planId: new UniqueEntityID(tpDb.planId),
        startsAt: tpDb.startsAt,
        expiresAt: tpDb.expiresAt,
        createdAt: tpDb.createdAt,
        updatedAt: tpDb.updatedAt,
      },
      new UniqueEntityID(tpDb.id),
    );
  }
}
