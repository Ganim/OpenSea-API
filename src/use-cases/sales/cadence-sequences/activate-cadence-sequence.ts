import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CadenceSequenceDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceSequenceToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface ActivateCadenceSequenceUseCaseRequest {
  id: string;
  tenantId: string;
}

interface ActivateCadenceSequenceUseCaseResponse {
  cadenceSequence: CadenceSequenceDTO;
}

export class ActivateCadenceSequenceUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: ActivateCadenceSequenceUseCaseRequest,
  ): Promise<ActivateCadenceSequenceUseCaseResponse> {
    const cadenceSequence = await this.cadenceSequencesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!cadenceSequence) {
      throw new ResourceNotFoundError('Cadence sequence');
    }

    cadenceSequence.activate();
    await this.cadenceSequencesRepository.save(cadenceSequence);

    return {
      cadenceSequence: cadenceSequenceToDTO(cadenceSequence),
    };
  }
}
