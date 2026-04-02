import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { DiscountRule } from '@/entities/sales/discount-rule';
import { prisma } from '@/lib/prisma';
import type { DiscountType } from '@prisma/generated/client.js';
import type {
  CreateDiscountRuleSchema,
  DiscountRulesRepository,
} from '../discount-rules-repository';

function mapToDomain(data: Record<string, unknown>): DiscountRule {
  return DiscountRule.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      description: (data.description as string) ?? undefined,
      type: data.type as 'PERCENTAGE' | 'FIXED_AMOUNT',
      value: Number(data.value),
      minOrderValue: data.minOrderValue
        ? Number(data.minOrderValue)
        : undefined,
      minQuantity: (data.minQuantity as number) ?? undefined,
      categoryId: (data.categoryId as string) ?? undefined,
      productId: (data.productId as string) ?? undefined,
      customerId: (data.customerId as string) ?? undefined,
      startDate: data.startDate as Date,
      endDate: data.endDate as Date,
      isActive: data.isActive as boolean,
      priority: data.priority as number,
      isStackable: data.isStackable as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaDiscountRulesRepository implements DiscountRulesRepository {
  async create(data: CreateDiscountRuleSchema): Promise<DiscountRule> {
    const discountRuleData = await prisma.discountRule.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        type: data.type as DiscountType,
        value: data.value,
        minOrderValue: data.minOrderValue,
        minQuantity: data.minQuantity,
        categoryId: data.categoryId,
        productId: data.productId,
        customerId: data.customerId,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
        priority: data.priority ?? 0,
        isStackable: data.isStackable ?? false,
      },
    });

    return mapToDomain(discountRuleData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<DiscountRule | null> {
    const discountRuleData = await prisma.discountRule.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!discountRuleData) return null;
    return mapToDomain(discountRuleData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<DiscountRule[]> {
    const discountRulesData = await prisma.discountRule.findMany({
      where: { tenantId, deletedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return discountRulesData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async findActiveByTenant(tenantId: string): Promise<DiscountRule[]> {
    const now = new Date();
    const discountRulesData = await prisma.discountRule.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { priority: 'desc' },
    });

    return discountRulesData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.discountRule.count({
      where: { tenantId, deletedAt: null },
    });
  }

  async save(discountRule: DiscountRule): Promise<void> {
    await prisma.discountRule.update({
      where: { id: discountRule.id.toString() },
      data: {
        name: discountRule.name,
        description: discountRule.description,
        type: discountRule.type as DiscountType,
        value: discountRule.value,
        minOrderValue: discountRule.minOrderValue,
        minQuantity: discountRule.minQuantity,
        categoryId: discountRule.categoryId,
        productId: discountRule.productId,
        customerId: discountRule.customerId,
        startDate: discountRule.startDate,
        endDate: discountRule.endDate,
        isActive: discountRule.isActive,
        priority: discountRule.priority,
        isStackable: discountRule.isStackable,
        deletedAt: discountRule.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.discountRule.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
