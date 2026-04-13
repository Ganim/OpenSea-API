import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomItemsRepository } from '@/repositories/production/bom-items-repository';

interface DeleteBomItemUseCaseRequest {
  id: string;
}

interface DeleteBomItemUseCaseResponse {
  message: string;
}

export class DeleteBomItemUseCase {
  constructor(private bomItemsRepository: BomItemsRepository) {}

  async execute({
    id,
  }: DeleteBomItemUseCaseRequest): Promise<DeleteBomItemUseCaseResponse> {
    const existing = await this.bomItemsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!existing) {
      throw new ResourceNotFoundError('BOM item not found.');
    }

    await this.bomItemsRepository.delete(new UniqueEntityID(id));

    return { message: 'BOM item deleted successfully.' };
  }
}
