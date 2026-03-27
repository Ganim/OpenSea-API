import type { CadenceSequenceDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceSequenceToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface ListCadenceSequencesUseCaseRequest {
  tenantId: string;
  page: number;
  perPage: number;
  isActive?: boolean;
  search?: string;
}

interface ListCadenceSequencesUseCaseResponse {
  cadenceSequences: CadenceSequenceDTO[];
  total: number;
}

export class ListCadenceSequencesUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: ListCadenceSequencesUseCaseRequest,
  ): Promise<ListCadenceSequencesUseCaseResponse> {
    const filters = {
      isActive: input.isActive,
      search: input.search,
    };

    const [cadenceSequences, total] = await Promise.all([
      this.cadenceSequencesRepository.findMany(
        input.page,
        input.perPage,
        input.tenantId,
        filters,
      ),
      this.cadenceSequencesRepository.countMany(input.tenantId, filters),
    ]);

    return {
      cadenceSequences: cadenceSequences.map(cadenceSequenceToDTO),
      total,
    };
  }
}
