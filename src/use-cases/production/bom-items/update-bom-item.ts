import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomItemsRepository } from '@/repositories/production/bom-items-repository';

interface UpdateBomItemUseCaseRequest {
  id: string;
  materialId?: string;
  sequence?: number;
  quantity?: number;
  unit?: string;
  wastagePercent?: number;
  isOptional?: boolean;
  substituteForId?: string | null;
  notes?: string | null;
}

interface UpdateBomItemUseCaseResponse {
  bomItem: import('@/entities/production/bom-item').ProductionBomItem;
}

export class UpdateBomItemUseCase {
  constructor(private bomItemsRepository: BomItemsRepository) {}

  async execute({
    id,
    materialId,
    sequence,
    quantity,
    unit,
    wastagePercent,
    isOptional,
    substituteForId,
    notes,
  }: UpdateBomItemUseCaseRequest): Promise<UpdateBomItemUseCaseResponse> {
    const existing = await this.bomItemsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!existing) {
      throw new ResourceNotFoundError('BOM item not found.');
    }

    const updatedItem = await this.bomItemsRepository.update({
      id: new UniqueEntityID(id),
      materialId,
      sequence,
      quantity,
      unit,
      wastagePercent,
      isOptional,
      substituteForId,
      notes,
    });

    if (!updatedItem) {
      throw new ResourceNotFoundError('BOM item not found.');
    }

    return { bomItem: updatedItem };
  }
}
