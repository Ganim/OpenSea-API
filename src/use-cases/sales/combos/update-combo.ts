import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Combo,
  ComboDiscountType,
  ComboType,
} from '@/entities/sales/combo';
import type { CombosRepository } from '@/repositories/sales/combos-repository';

interface UpdateComboUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  type?: ComboType;
  discountType?: ComboDiscountType;
  discountValue?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  minItems?: number;
  maxItems?: number;
}

interface UpdateComboUseCaseResponse {
  combo: Combo;
}

export class UpdateComboUseCase {
  constructor(private combosRepository: CombosRepository) {}

  async execute(
    request: UpdateComboUseCaseRequest,
  ): Promise<UpdateComboUseCaseResponse> {
    const existing = await this.combosRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Combo not found.');
    }

    const combo = await this.combosRepository.update({
      id: new UniqueEntityID(request.id),
      tenantId: request.tenantId,
      name: request.name,
      description: request.description,
      type: request.type,
      discountType: request.discountType,
      discountValue: request.discountValue,
      isActive: request.isActive,
      startDate: request.startDate,
      endDate: request.endDate,
      minItems: request.minItems,
      maxItems: request.maxItems,
    });

    if (!combo) {
      throw new ResourceNotFoundError('Combo not found.');
    }

    return { combo };
  }
}
