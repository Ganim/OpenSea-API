import { TenantFeatureFlag } from '@/entities/core/tenant-feature-flag';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CreateTenantFeatureFlagSchema,
  TenantFeatureFlagsRepository,
} from '../tenant-feature-flags-repository';

export class PrismaTenantFeatureFlagsRepository
  implements TenantFeatureFlagsRepository
{
  async create(
    data: CreateTenantFeatureFlagSchema,
  ): Promise<TenantFeatureFlag> {
    const ffDb = await prisma.tenantFeatureFlag.create({
      data: {
        tenantId: data.tenantId.toString(),
        flag: data.flag,
        enabled: data.enabled ?? false,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return TenantFeatureFlag.create(
      {
        tenantId: new UniqueEntityID(ffDb.tenantId),
        flag: ffDb.flag,
        enabled: ffDb.enabled,
        metadata: (ffDb.metadata as Record<string, unknown>) ?? {},
        createdAt: ffDb.createdAt,
        updatedAt: ffDb.updatedAt,
      },
      new UniqueEntityID(ffDb.id),
    );
  }

  async findByTenantAndFlag(
    tenantId: UniqueEntityID,
    flag: string,
  ): Promise<TenantFeatureFlag | null> {
    const ffDb = await prisma.tenantFeatureFlag.findFirst({
      where: {
        tenantId: tenantId.toString(),
        flag,
      },
    });
    if (!ffDb) return null;

    return TenantFeatureFlag.create(
      {
        tenantId: new UniqueEntityID(ffDb.tenantId),
        flag: ffDb.flag,
        enabled: ffDb.enabled,
        metadata: (ffDb.metadata as Record<string, unknown>) ?? {},
        createdAt: ffDb.createdAt,
        updatedAt: ffDb.updatedAt,
      },
      new UniqueEntityID(ffDb.id),
    );
  }

  async findByTenant(tenantId: UniqueEntityID): Promise<TenantFeatureFlag[]> {
    const ffsDb = await prisma.tenantFeatureFlag.findMany({
      where: { tenantId: tenantId.toString() },
    });

    return ffsDb.map((ffDb) =>
      TenantFeatureFlag.create(
        {
          tenantId: new UniqueEntityID(ffDb.tenantId),
          flag: ffDb.flag,
          enabled: ffDb.enabled,
          metadata: (ffDb.metadata as Record<string, unknown>) ?? {},
          createdAt: ffDb.createdAt,
          updatedAt: ffDb.updatedAt,
        },
        new UniqueEntityID(ffDb.id),
      ),
    );
  }

  async updateFlag(
    tenantId: UniqueEntityID,
    flag: string,
    enabled: boolean,
  ): Promise<TenantFeatureFlag | null> {
    const existing = await prisma.tenantFeatureFlag.findFirst({
      where: {
        tenantId: tenantId.toString(),
        flag,
      },
    });
    if (!existing) return null;

    const ffDb = await prisma.tenantFeatureFlag.update({
      where: { id: existing.id },
      data: { enabled },
    });

    return TenantFeatureFlag.create(
      {
        tenantId: new UniqueEntityID(ffDb.tenantId),
        flag: ffDb.flag,
        enabled: ffDb.enabled,
        metadata: (ffDb.metadata as Record<string, unknown>) ?? {},
        createdAt: ffDb.createdAt,
        updatedAt: ffDb.updatedAt,
      },
      new UniqueEntityID(ffDb.id),
    );
  }

  async deleteFlag(tenantId: UniqueEntityID, flag: string): Promise<void> {
    const existing = await prisma.tenantFeatureFlag.findFirst({
      where: {
        tenantId: tenantId.toString(),
        flag,
      },
    });

    if (existing) {
      await prisma.tenantFeatureFlag.delete({
        where: { id: existing.id },
      });
    }
  }
}
