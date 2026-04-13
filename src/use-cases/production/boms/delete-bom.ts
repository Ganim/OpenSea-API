import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomsRepository } from '@/repositories/production/boms-repository';

interface DeleteBomUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteBomUseCaseResponse {
  message: string;
}

export class DeleteBomUseCase {
  constructor(private bomsRepository: BomsRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteBomUseCaseRequest): Promise<DeleteBomUseCaseResponse> {
    const bom = await this.bomsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!bom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    await this.bomsRepository.delete(new UniqueEntityID(id));

    return { message: 'BOM deleted successfully.' };
  }
}
