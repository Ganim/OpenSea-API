import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import type {
  CreateVariantPromotionSchema,
  UpdateVariantPromotionSchema,
  VariantPromotionsRepository,
} from '../variant-promotions-repository';

export class InMemoryVariantPromotionsRepository
  implements VariantPromotionsRepository
{
  public items: VariantPromotion[] = [];

  async create(data: CreateVariantPromotionSchema): Promise<VariantPromotion> {
    const promotion = VariantPromotion.create({
      variantId: data.variantId,
      name: data.name,
      discountType: data.discountType,
      discountValue: data.discountValue,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? true,
      notes: data.notes,
    });

    this.items.push(promotion);
    return promotion;
  }

  async findById(id: UniqueEntityID): Promise<VariantPromotion | null> {
    const promotion = this.items.find((item) => item.id.equals(id));
    return promotion ?? null;
  }

  async findManyByVariant(
    variantId: UniqueEntityID,
  ): Promise<VariantPromotion[]> {
    return this.items.filter((item) => item.variantId.equals(variantId));
  }

  async findManyActive(): Promise<VariantPromotion[]> {
    return this.items.filter((item) => item.isActive);
  }

  async findManyActiveByVariant(
    variantId: UniqueEntityID,
  ): Promise<VariantPromotion[]> {
    return this.items.filter(
      (item) => item.variantId.equals(variantId) && item.isCurrentlyValid,
    );
  }

  async update(
    data: UpdateVariantPromotionSchema,
  ): Promise<VariantPromotion | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) {
      return null;
    }

    const promotion = this.items[index];

    if (data.name !== undefined) promotion.name = data.name;
    if (data.discountValue !== undefined)
      promotion.discountValue = data.discountValue;
    if (data.startDate !== undefined) promotion.startDate = data.startDate;
    if (data.endDate !== undefined) promotion.endDate = data.endDate;
    if (data.isActive !== undefined) promotion.isActive = data.isActive;
    if (data.notes !== undefined) promotion.notes = data.notes;

    return promotion;
  }

  async save(promotion: VariantPromotion): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(promotion.id));

    if (index >= 0) {
      this.items[index] = promotion;
    } else {
      this.items.push(promotion);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const promotion = await this.findById(id);

    if (promotion) {
      promotion.deactivate();
    }
  }
}
