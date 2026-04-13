import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomItemsRepository } from '@/repositories/production/bom-items-repository';

interface ListBomItemsUseCaseRequest {
  bomId: string;
}

interface ListBomItemsUseCaseResponse {
  bomItems: import('@/entities/production/bom-item').ProductionBomItem[];
}

export class ListBomItemsUseCase {
  constructor(private bomItemsRepository: BomItemsRepository) {}

  async execute({
    bomId,
  }: ListBomItemsUseCaseRequest): Promise<ListBomItemsUseCaseResponse> {
    const bomItems = await this.bomItemsRepository.findManyByBomId(
      new UniqueEntityID(bomId),
    );

    return { bomItems };
  }
}
