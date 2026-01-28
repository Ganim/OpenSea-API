import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import { prisma } from '@/lib/prisma';
import type { DiscountType as PrismaDiscountType } from '@prisma/generated/client.js';
import type {
  CreateVariantPromotionSchema,
  UpdateVariantPromotionSchema,
  VariantPromotionsRepository,
} from '../variant-promotions-repository';

export class PrismaVariantPromotionsRepository
  implements VariantPromotionsRepository
{
  async create(data: CreateVariantPromotionSchema): Promise<VariantPromotion> {
    const promotionData = await prisma.variantPromotion.create({
      data: {
        variantId: data.variantId.toString(),
        name: data.name,
        discountType: data.discountType.value as PrismaDiscountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
        notes: data.notes,
      },
    });

    return VariantPromotion.create(
      {
        variantId: new EntityID(promotionData.variantId),
        name: promotionData.name,
        discountType: DiscountType.create(promotionData.discountType),
        discountValue: Number(promotionData.discountValue),
        startDate: promotionData.startDate,
        endDate: promotionData.endDate,
        isActive: promotionData.isActive,
        notes: promotionData.notes ?? undefined,
        createdAt: promotionData.createdAt,
        updatedAt: promotionData.updatedAt,
        deletedAt: promotionData.deletedAt ?? undefined,
      },
      new EntityID(promotionData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<VariantPromotion | null> {
    const promotionData = await prisma.variantPromotion.findUnique({
      where: { id: id.toString() },
    });

    if (!promotionData) return null;

    return VariantPromotion.create(
      {
        variantId: new EntityID(promotionData.variantId),
        name: promotionData.name,
        discountType: DiscountType.create(promotionData.discountType),
        discountValue: Number(promotionData.discountValue),
        startDate: promotionData.startDate,
        endDate: promotionData.endDate,
        isActive: promotionData.isActive,
        notes: promotionData.notes ?? undefined,
        createdAt: promotionData.createdAt,
        updatedAt: promotionData.updatedAt,
        deletedAt: promotionData.deletedAt ?? undefined,
      },
      new EntityID(promotionData.id),
    );
  }

  async findManyByVariant(
    variantId: UniqueEntityID,
  ): Promise<VariantPromotion[]> {
    const promotionsData = await prisma.variantPromotion.findMany({
      where: {
        variantId: variantId.toString(),
      },
      orderBy: { startDate: 'desc' },
    });

    return promotionsData.map((promotionData) =>
      VariantPromotion.create(
        {
          variantId: new EntityID(promotionData.variantId),
          name: promotionData.name,
          discountType: DiscountType.create(promotionData.discountType),
          discountValue: Number(promotionData.discountValue),
          startDate: promotionData.startDate,
          endDate: promotionData.endDate,
          isActive: promotionData.isActive,
          notes: promotionData.notes ?? undefined,
          createdAt: promotionData.createdAt,
          updatedAt: promotionData.updatedAt,
          deletedAt: promotionData.deletedAt ?? undefined,
        },
        new EntityID(promotionData.id),
      ),
    );
  }

  async findManyActive(): Promise<VariantPromotion[]> {
    const promotionsData = await prisma.variantPromotion.findMany({
      where: {
        isActive: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return promotionsData.map((promotionData) =>
      VariantPromotion.create(
        {
          variantId: new EntityID(promotionData.variantId),
          name: promotionData.name,
          discountType: DiscountType.create(promotionData.discountType),
          discountValue: Number(promotionData.discountValue),
          startDate: promotionData.startDate,
          endDate: promotionData.endDate,
          isActive: promotionData.isActive,
          notes: promotionData.notes ?? undefined,
          createdAt: promotionData.createdAt,
          updatedAt: promotionData.updatedAt,
          deletedAt: promotionData.deletedAt ?? undefined,
        },
        new EntityID(promotionData.id),
      ),
    );
  }

  async findManyActiveByVariant(
    variantId: UniqueEntityID,
  ): Promise<VariantPromotion[]> {
    const now = new Date();
    const promotionsData = await prisma.variantPromotion.findMany({
      where: {
        variantId: variantId.toString(),
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return promotionsData.map((promotionData) =>
      VariantPromotion.create(
        {
          variantId: new EntityID(promotionData.variantId),
          name: promotionData.name,
          discountType: DiscountType.create(promotionData.discountType),
          discountValue: Number(promotionData.discountValue),
          startDate: promotionData.startDate,
          endDate: promotionData.endDate,
          isActive: promotionData.isActive,
          notes: promotionData.notes ?? undefined,
          createdAt: promotionData.createdAt,
          updatedAt: promotionData.updatedAt,
          deletedAt: promotionData.deletedAt ?? undefined,
        },
        new EntityID(promotionData.id),
      ),
    );
  }

  async update(
    data: UpdateVariantPromotionSchema,
  ): Promise<VariantPromotion | null> {
    try {
      const promotionData = await prisma.variantPromotion.update({
        where: { id: data.id.toString() },
        data: {
          name: data.name,
          discountValue: data.discountValue,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: data.isActive,
          notes: data.notes,
        },
      });

      return VariantPromotion.create(
        {
          variantId: new EntityID(promotionData.variantId),
          name: promotionData.name,
          discountType: DiscountType.create(promotionData.discountType),
          discountValue: Number(promotionData.discountValue),
          startDate: promotionData.startDate,
          endDate: promotionData.endDate,
          isActive: promotionData.isActive,
          notes: promotionData.notes ?? undefined,
          createdAt: promotionData.createdAt,
          updatedAt: promotionData.updatedAt,
          deletedAt: promotionData.deletedAt ?? undefined,
        },
        new EntityID(promotionData.id),
      );
    } catch {
      return null;
    }
  }

  async save(promotion: VariantPromotion): Promise<void> {
    await prisma.variantPromotion.upsert({
      where: { id: promotion.id.toString() },
      create: {
        id: promotion.id.toString(),
        variantId: promotion.variantId.toString(),
        name: promotion.name,
        discountType: promotion.discountType.value as PrismaDiscountType,
        discountValue: promotion.discountValue,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        notes: promotion.notes,
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt ?? new Date(),
        deletedAt: promotion.deletedAt,
      },
      update: {
        name: promotion.name,
        discountValue: promotion.discountValue,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        notes: promotion.notes,
        updatedAt: promotion.updatedAt ?? new Date(),
        deletedAt: promotion.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.variantPromotion.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
