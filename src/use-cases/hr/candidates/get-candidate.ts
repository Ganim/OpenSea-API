import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Candidate } from '@/entities/hr/candidate';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';

export interface GetCandidateRequest {
  tenantId: string;
  candidateId: string;
}

export interface GetCandidateResponse {
  candidate: Candidate;
}

export class GetCandidateUseCase {
  constructor(private candidatesRepository: CandidatesRepository) {}

  async execute(request: GetCandidateRequest): Promise<GetCandidateResponse> {
    const { tenantId, candidateId } = request;

    const candidate = await this.candidatesRepository.findById(
      new UniqueEntityID(candidateId),
      tenantId,
    );

    if (!candidate) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    return { candidate };
  }
}
