import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Termination } from '@/entities/hr/termination';
import { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface GetTerminationRequest {
  tenantId: string;
  terminationId: string;
}

export interface GetTerminationResponse {
  termination: Termination;
}

export class GetTerminationUseCase {
  constructor(private terminationsRepository: TerminationsRepository) {}

  async execute(
    request: GetTerminationRequest,
  ): Promise<GetTerminationResponse> {
    const { tenantId, terminationId } = request;

    const termination = await this.terminationsRepository.findById(
      new UniqueEntityID(terminationId),
      tenantId,
    );

    if (!termination) {
      throw new ResourceNotFoundError('Rescisão não encontrada');
    }

    return { termination };
  }
}
