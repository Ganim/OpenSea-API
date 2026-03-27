import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CadenceSequenceDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceSequenceToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface DeactivateCadenceSequenceUseCaseRequest {
  id: string;
  tenantId: string;
}

interface DeactivateCadenceSequenceUseCaseResponse {
  cadenceSequence: CadenceSequenceDTO;
}

export class DeactivateCadenceSequenceUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: DeactivateCadenceSequenceUseCaseRequest,
  ): Promise<DeactivateCadenceSequenceUseCaseResponse> {
    const cadenceSequence = await this.cadenceSequencesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!cadenceSequence) {
      throw new ResourceNotFoundError('Cadence sequence');
    }

    cadenceSequence.deactivate();
    await this.cadenceSequencesRepository.save(cadenceSequence);

    return {
      cadenceSequence: cadenceSequenceToDTO(cadenceSequence),
    };
  }
}
