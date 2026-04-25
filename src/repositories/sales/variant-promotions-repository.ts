import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { VariantPromotion } from '@/entities/sales/variant-promotion';

export interface CreateVariantPromotionSchema {
  variantId: UniqueEntityID;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateVariantPromotionSchema {
  id: UniqueEntityID;
  name?: string;
  discountValue?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  notes?: string;
}

export interface VariantPromotionsRepository {
  create(data: CreateVariantPromotionSchema): Promise<VariantPromotion>;
  findById(id: UniqueEntityID): Promise<VariantPromotion | null>;
  findManyByVariant(variantId: UniqueEntityID): Promise<VariantPromotion[]>;
  findManyActive(): Promise<VariantPromotion[]>;
  findManyActiveByVariant(
    variantId: UniqueEntityID,
  ): Promise<VariantPromotion[]>;
  /**
   * Bulk lookup of currently-valid promotions covering a list of variants.
   * "Currently valid" means `isActive = true` AND `startDate <= now <= endDate`.
   * Soft-deleted promotions (`deletedAt != null`) are skipped.
   *
   * Used by the POS catalog delta endpoint (Emporion Phase 1) to ship the
   * promotions that apply to the variants returned for a terminal's zones.
   * Returns `[]` for an empty `variantIds` argument without hitting the
   * database.
   *
   * Note: tenant isolation is delegated to the variant scope — promotions are
   * physically owned by their parent variant (cascade-on-delete) and the
   * caller is expected to have already filtered the variant list by tenant.
   */
  findActiveForVariants(
    variantIds: UniqueEntityID[],
  ): Promise<VariantPromotion[]>;
  update(data: UpdateVariantPromotionSchema): Promise<VariantPromotion | null>;
  save(promotion: VariantPromotion): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
