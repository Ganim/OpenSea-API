import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Candidate } from '@/entities/hr/candidate';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';

export interface DeleteCandidateRequest {
  tenantId: string;
  candidateId: string;
}

export interface DeleteCandidateResponse {
  candidate: Candidate;
}

export class DeleteCandidateUseCase {
  constructor(private candidatesRepository: CandidatesRepository) {}

  async execute(
    request: DeleteCandidateRequest,
  ): Promise<DeleteCandidateResponse> {
    const { tenantId, candidateId } = request;

    const candidate = await this.candidatesRepository.findById(
      new UniqueEntityID(candidateId),
      tenantId,
    );

    if (!candidate) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    candidate.softDelete();

    await this.candidatesRepository.delete(new UniqueEntityID(candidateId));

    return { candidate };
  }
}
