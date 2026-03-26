import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';

export interface DeleteRubricaRequest {
  tenantId: string;
  rubricaId: string;
}

export class DeleteRubricaUseCase {
  constructor(private rubricasRepository: EsocialRubricasRepository) {}

  async execute(request: DeleteRubricaRequest): Promise<void> {
    const id = new UniqueEntityID(request.rubricaId);

    const existing = await this.rubricasRepository.findById(
      id,
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Rubrica not found');
    }

    await this.rubricasRepository.delete(id);
  }
}
