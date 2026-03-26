import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Termination } from '@/entities/hr/termination';
import { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface UpdateTerminationRequest {
  tenantId: string;
  terminationId: string;
  markAsPaid?: boolean;
  notes?: string;
}

export interface UpdateTerminationResponse {
  termination: Termination;
}

export class UpdateTerminationUseCase {
  constructor(private terminationsRepository: TerminationsRepository) {}

  async execute(
    request: UpdateTerminationRequest,
  ): Promise<UpdateTerminationResponse> {
    const { tenantId, terminationId, markAsPaid, notes } = request;

    const termination = await this.terminationsRepository.findById(
      new UniqueEntityID(terminationId),
      tenantId,
    );

    if (!termination) {
      throw new ResourceNotFoundError('Rescisão não encontrada');
    }

    if (markAsPaid) {
      if (!termination.isCalculated()) {
        throw new BadRequestError(
          'Somente rescisões calculadas podem ser marcadas como pagas',
        );
      }
      termination.markAsPaid();
    }

    if (notes !== undefined) {
      termination.updateNotes(notes);
    }

    await this.terminationsRepository.save(termination);

    return { termination };
  }
}
