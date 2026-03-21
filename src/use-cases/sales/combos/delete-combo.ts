import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CombosRepository } from '@/repositories/sales/combos-repository';

interface DeleteComboUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteComboUseCaseResponse {
  message: string;
}

export class DeleteComboUseCase {
  constructor(private combosRepository: CombosRepository) {}

  async execute(
    request: DeleteComboUseCaseRequest,
  ): Promise<DeleteComboUseCaseResponse> {
    const combo = await this.combosRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!combo) {
      throw new ResourceNotFoundError('Combo not found.');
    }

    await this.combosRepository.delete(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    return { message: 'Combo deleted successfully.' };
  }
}
