import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { DiscountRuleDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { discountRuleToDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { DiscountRulesRepository } from '@/repositories/sales/discount-rules-repository';

interface CreateDiscountRuleUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderValue?: number;
  minQuantity?: number;
  categoryId?: string;
  productId?: string;
  customerId?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  priority?: number;
  isStackable?: boolean;
}

interface CreateDiscountRuleUseCaseResponse {
  discountRule: DiscountRuleDTO;
}

export class CreateDiscountRuleUseCase {
  constructor(private discountRulesRepository: DiscountRulesRepository) {}

  async execute(
    input: CreateDiscountRuleUseCaseRequest,
  ): Promise<CreateDiscountRuleUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Discount rule name is required.');
    }

    if (input.name.length > 255) {
      throw new BadRequestError(
        'Discount rule name cannot exceed 255 characters.',
      );
    }

    if (input.value <= 0) {
      throw new BadRequestError('Discount value must be greater than zero.');
    }

    if (input.type === 'PERCENTAGE' && input.value > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100.');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestError('Invalid date format for start or end date.');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date.');
    }

    if (input.minOrderValue !== undefined && input.minOrderValue < 0) {
      throw new BadRequestError('Minimum order value cannot be negative.');
    }

    if (input.minQuantity !== undefined && input.minQuantity < 1) {
      throw new BadRequestError('Minimum quantity must be at least 1.');
    }

    const discountRule = await this.discountRulesRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      description: input.description,
      type: input.type,
      value: input.value,
      minOrderValue: input.minOrderValue,
      minQuantity: input.minQuantity,
      categoryId: input.categoryId,
      productId: input.productId,
      customerId: input.customerId,
      startDate,
      endDate,
      isActive: input.isActive,
      priority: input.priority,
      isStackable: input.isStackable,
    });

    return {
      discountRule: discountRuleToDTO(discountRule),
    };
  }
}
