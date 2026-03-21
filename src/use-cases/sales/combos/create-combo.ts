import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { Combo, ComboDiscountType, ComboItemProps, ComboType } from '@/entities/sales/combo';
import type { CombosRepository } from '@/repositories/sales/combos-repository';

interface CreateComboUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  type: ComboType;
  discountType: ComboDiscountType;
  discountValue: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  items?: ComboItemProps[];
  categoryIds?: string[];
  minItems?: number;
  maxItems?: number;
}

interface CreateComboUseCaseResponse {
  combo: Combo;
}

export class CreateComboUseCase {
  constructor(private combosRepository: CombosRepository) {}

  async execute(
    request: CreateComboUseCaseRequest,
  ): Promise<CreateComboUseCaseResponse> {
    if (!request.name || request.name.trim().length === 0) {
      throw new BadRequestError('Combo name is required.');
    }

    const combo = await this.combosRepository.create({
      tenantId: request.tenantId,
      name: request.name.trim(),
      description: request.description,
      type: request.type,
      discountType: request.discountType,
      discountValue: request.discountValue,
      isActive: request.isActive,
      startDate: request.startDate,
      endDate: request.endDate,
      items: request.items,
      categoryIds: request.categoryIds,
      minItems: request.minItems,
      maxItems: request.maxItems,
    });

    return { combo };
  }
}
