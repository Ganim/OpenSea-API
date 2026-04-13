import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomItemsRepository } from '@/repositories/production/bom-items-repository';
import { BomsRepository } from '@/repositories/production/boms-repository';

interface CreateBomItemUseCaseRequest {
  tenantId: string;
  bomId: string;
  materialId: string;
  sequence?: number;
  quantity: number;
  unit: string;
  wastagePercent?: number;
  isOptional?: boolean;
  substituteForId?: string;
  notes?: string;
}

interface CreateBomItemUseCaseResponse {
  bomItem: import('@/entities/production/bom-item').ProductionBomItem;
}

export class CreateBomItemUseCase {
  constructor(
    private bomItemsRepository: BomItemsRepository,
    private bomsRepository: BomsRepository,
  ) {}

  async execute({
    tenantId,
    bomId,
    materialId,
    sequence,
    quantity,
    unit,
    wastagePercent,
    isOptional,
    substituteForId,
    notes,
  }: CreateBomItemUseCaseRequest): Promise<CreateBomItemUseCaseResponse> {
    const bom = await this.bomsRepository.findById(
      new UniqueEntityID(bomId),
      tenantId,
    );

    if (!bom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    // Auto-sequence if not provided
    let finalSequence = sequence;
    if (finalSequence === undefined) {
      const existingItems = await this.bomItemsRepository.findManyByBomId(
        new UniqueEntityID(bomId),
      );
      finalSequence =
        existingItems.length > 0
          ? Math.max(...existingItems.map((i) => i.sequence)) + 1
          : 1;
    }

    const bomItem = await this.bomItemsRepository.create({
      bomId,
      materialId,
      sequence: finalSequence,
      quantity,
      unit,
      wastagePercent,
      isOptional,
      substituteForId,
      notes,
    });

    return { bomItem };
  }
}
