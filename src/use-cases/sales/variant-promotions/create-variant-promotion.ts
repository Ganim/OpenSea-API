import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import {
  variantPromotionToDTO,
  type VariantPromotionDTO,
} from '@/mappers/sales/variant-promotion/variant-promotion-to-dto';
import { VariantPromotionsRepository } from '@/repositories/sales/variant-promotions-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

interface CreateVariantPromotionRequest {
  tenantId: string;
  variantId: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  notes?: string;
}

interface CreateVariantPromotionResponse {
  promotion: VariantPromotionDTO;
}

export class CreateVariantPromotionUseCase {
  constructor(
    private variantPromotionsRepository: VariantPromotionsRepository,
    private variantsRepository: VariantsRepository,
  ) {}

  async execute(
    request: CreateVariantPromotionRequest,
  ): Promise<CreateVariantPromotionResponse> {
    const {
      variantId,
      name,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive = true,
      notes,
    } = request;

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestError('Name is required');
    }
    if (trimmedName.length > 100) {
      throw new BadRequestError('Name must not exceed 100 characters');
    }

    // Validate discount type
    if (discountType !== 'PERCENTAGE' && discountType !== 'FIXED_AMOUNT') {
      throw new BadRequestError(
        'Discount type must be either PERCENTAGE or FIXED_AMOUNT',
      );
    }

    // Validate discount value
    if (discountValue < 0) {
      throw new BadRequestError('Discount value cannot be negative');
    }
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100%');
    }

    // Validate dates
    if (startDate >= endDate) {
      throw new BadRequestError('Start date must be before end date');
    }

    // Validate variant exists
    const variant = await this.variantsRepository.findById(
      new UniqueEntityID(variantId),
      request.tenantId,
    );
    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    // Create promotion
    const promotion = await this.variantPromotionsRepository.create({
      variantId: new UniqueEntityID(variantId),
      name: trimmedName,
      discountType: DiscountType.create(discountType),
      discountValue,
      startDate,
      endDate,
      isActive,
      notes: notes?.trim() || undefined,
    });

    return { promotion: variantPromotionToDTO(promotion) };
  }
}
