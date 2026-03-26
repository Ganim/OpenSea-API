import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DiscountRuleDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { discountRuleToDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { DiscountRulesRepository } from '@/repositories/sales/discount-rules-repository';

interface UpdateDiscountRuleUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value?: number;
  minOrderValue?: number | null;
  minQuantity?: number | null;
  categoryId?: string | null;
  productId?: string | null;
  customerId?: string | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  priority?: number;
  isStackable?: boolean;
}

interface UpdateDiscountRuleUseCaseResponse {
  discountRule: DiscountRuleDTO;
}

export class UpdateDiscountRuleUseCase {
  constructor(private discountRulesRepository: DiscountRulesRepository) {}

  async execute(
    input: UpdateDiscountRuleUseCaseRequest,
  ): Promise<UpdateDiscountRuleUseCaseResponse> {
    const discountRule = await this.discountRulesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!discountRule) {
      throw new ResourceNotFoundError('Discount rule not found.');
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new BadRequestError('Discount rule name cannot be empty.');
      }
      if (input.name.length > 255) {
        throw new BadRequestError('Discount rule name cannot exceed 255 characters.');
      }
      discountRule.name = input.name.trim();
    }

    if (input.description !== undefined) {
      discountRule.description = input.description || undefined;
    }

    if (input.type !== undefined) {
      discountRule.type = input.type;
    }

    if (input.value !== undefined) {
      if (input.value <= 0) {
        throw new BadRequestError('Discount value must be greater than zero.');
      }
      const typeToCheck = input.type ?? discountRule.type;
      if (typeToCheck === 'PERCENTAGE' && input.value > 100) {
        throw new BadRequestError('Percentage discount cannot exceed 100.');
      }
      discountRule.value = input.value;
    }

    if (input.minOrderValue !== undefined) {
      discountRule.minOrderValue = input.minOrderValue ?? undefined;
    }

    if (input.minQuantity !== undefined) {
      if (input.minQuantity !== null && input.minQuantity < 1) {
        throw new BadRequestError('Minimum quantity must be at least 1.');
      }
      discountRule.minQuantity = input.minQuantity ?? undefined;
    }

    if (input.categoryId !== undefined) {
      discountRule.categoryId = input.categoryId ?? undefined;
    }

    if (input.productId !== undefined) {
      discountRule.productId = input.productId ?? undefined;
    }

    if (input.customerId !== undefined) {
      discountRule.customerId = input.customerId ?? undefined;
    }

    if (input.startDate !== undefined) {
      const startDate = new Date(input.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestError('Invalid start date format.');
      }
      discountRule.startDate = startDate;
    }

    if (input.endDate !== undefined) {
      const endDate = new Date(input.endDate);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestError('Invalid end date format.');
      }
      discountRule.endDate = endDate;
    }

    if (discountRule.endDate <= discountRule.startDate) {
      throw new BadRequestError('End date must be after start date.');
    }

    if (input.isActive !== undefined) {
      discountRule.isActive = input.isActive;
    }

    if (input.priority !== undefined) {
      discountRule.priority = input.priority;
    }

    if (input.isStackable !== undefined) {
      discountRule.isStackable = input.isStackable;
    }

    await this.discountRulesRepository.save(discountRule);

    return {
      discountRule: discountRuleToDTO(discountRule),
    };
  }
}
