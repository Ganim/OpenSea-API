import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  variantPromotionToDTO,
  type VariantPromotionDTO,
} from '@/mappers/sales/variant-promotion/variant-promotion-to-dto';
import { VariantPromotionsRepository } from '@/repositories/sales/variant-promotions-repository';

interface UpdateVariantPromotionRequest {
  id: string;
  name?: string;
  discountValue?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  notes?: string;
}

interface UpdateVariantPromotionResponse {
  promotion: VariantPromotionDTO;
}

export class UpdateVariantPromotionUseCase {
  constructor(
    private variantPromotionsRepository: VariantPromotionsRepository,
  ) {}

  async execute(
    request: UpdateVariantPromotionRequest,
  ): Promise<UpdateVariantPromotionResponse> {
    const { id, name, discountValue, startDate, endDate, isActive, notes } =
      request;

    const promotion = await this.variantPromotionsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!promotion) {
      throw new ResourceNotFoundError('Promotion not found');
    }

    // Update name
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new BadRequestError('Name is required');
      }
      if (trimmedName.length > 100) {
        throw new BadRequestError('Name must not exceed 100 characters');
      }
      promotion.name = trimmedName;
    }

    // Update discount value
    if (discountValue !== undefined) {
      if (discountValue < 0) {
        throw new BadRequestError('Discount value cannot be negative');
      }
      if (promotion.discountType.isPercentage && discountValue > 100) {
        throw new BadRequestError('Percentage discount cannot exceed 100%');
      }
      promotion.discountValue = discountValue;
    }

    // Update dates
    if (startDate !== undefined) {
      promotion.startDate = startDate;
    }
    if (endDate !== undefined) {
      promotion.endDate = endDate;
    }

    // Update isActive
    if (isActive !== undefined) {
      promotion.isActive = isActive;
    }

    // Update notes
    if (notes !== undefined) {
      promotion.notes = notes.trim() || undefined;
    }

    await this.variantPromotionsRepository.save(promotion);

    return { promotion: variantPromotionToDTO(promotion) };
  }
}
