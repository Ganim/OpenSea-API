import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface DeleteCadenceSequenceUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteCadenceSequenceUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(input: DeleteCadenceSequenceUseCaseRequest): Promise<void> {
    const cadenceSequence = await this.cadenceSequencesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!cadenceSequence) {
      throw new ResourceNotFoundError('Cadence sequence');
    }

    await this.cadenceSequencesRepository.delete(
      new UniqueEntityID(input.id),
      input.tenantId,
    );
  }
}
