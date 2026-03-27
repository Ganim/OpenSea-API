import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CadenceSequenceDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceSequenceToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface GetCadenceSequenceByIdUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetCadenceSequenceByIdUseCaseResponse {
  cadenceSequence: CadenceSequenceDTO;
}

export class GetCadenceSequenceByIdUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: GetCadenceSequenceByIdUseCaseRequest,
  ): Promise<GetCadenceSequenceByIdUseCaseResponse> {
    const cadenceSequence = await this.cadenceSequencesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!cadenceSequence) {
      throw new ResourceNotFoundError('Cadence sequence');
    }

    return {
      cadenceSequence: cadenceSequenceToDTO(cadenceSequence),
    };
  }
}
