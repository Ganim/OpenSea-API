import {
  tenantSubscriptionPrismaToDomain,
  tenantSubscriptionToPrisma,
} from '@/mappers/core/tenant-subscription-mapper';
import { prisma } from '@/lib/prisma';
import type { TenantSubscription } from '@/entities/core/tenant-subscription';
import type { Prisma } from '@prisma/generated/client';
import type { TenantSubscriptionsRepository } from '../tenant-subscriptions-repository';

export class PrismaTenantSubscriptionsRepository
  implements TenantSubscriptionsRepository
{
  async findByTenantId(tenantId: string): Promise<TenantSubscription[]> {
    const subscriptionsDb = await prisma.tenantSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptionsDb.map(tenantSubscriptionPrismaToDomain);
  }

  async findByTenantAndSkill(
    tenantId: string,
    skillCode: string,
  ): Promise<TenantSubscription | null> {
    const subscriptionDb = await prisma.tenantSubscription.findUnique({
      where: { tenantId_skillCode: { tenantId, skillCode } },
    });
    if (!subscriptionDb) return null;

    return tenantSubscriptionPrismaToDomain(subscriptionDb);
  }

  async findActiveByTenantId(tenantId: string): Promise<TenantSubscription[]> {
    const subscriptionsDb = await prisma.tenantSubscription.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptionsDb.map(tenantSubscriptionPrismaToDomain);
  }

  async create(entity: TenantSubscription): Promise<void> {
    const prismaData = tenantSubscriptionToPrisma(entity);

    await prisma.tenantSubscription.create({
      data: prismaData as Prisma.TenantSubscriptionUncheckedCreateInput,
    });
  }

  async save(entity: TenantSubscription): Promise<void> {
    const prismaData = tenantSubscriptionToPrisma(entity);

    await prisma.tenantSubscription.update({
      where: { id: prismaData.id },
      data: prismaData as Prisma.TenantSubscriptionUncheckedUpdateInput,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.tenantSubscription.delete({
      where: { id },
    });
  }
}
