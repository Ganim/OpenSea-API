import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Combo } from '@/entities/sales/combo';
import type { CombosRepository } from '@/repositories/sales/combos-repository';

interface GetComboByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetComboByIdUseCaseResponse {
  combo: Combo;
}

export class GetComboByIdUseCase {
  constructor(private combosRepository: CombosRepository) {}

  async execute(
    request: GetComboByIdUseCaseRequest,
  ): Promise<GetComboByIdUseCaseResponse> {
    const combo = await this.combosRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!combo) {
      throw new ResourceNotFoundError('Combo not found.');
    }

    return { combo };
  }
}
