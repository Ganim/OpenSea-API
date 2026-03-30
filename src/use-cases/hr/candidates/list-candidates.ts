import type { Candidate } from '@/entities/hr/candidate';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';

export interface ListCandidatesRequest {
  tenantId: string;
  source?: string;
  search?: string;
  tags?: string[];
  page?: number;
  perPage?: number;
}

export interface ListCandidatesResponse {
  candidates: Candidate[];
  total: number;
}

export class ListCandidatesUseCase {
  constructor(private candidatesRepository: CandidatesRepository) {}

  async execute(
    request: ListCandidatesRequest,
  ): Promise<ListCandidatesResponse> {
    const { tenantId, ...filters } = request;

    const { candidates, total } =
      await this.candidatesRepository.findMany(tenantId, filters);

    return { candidates, total };
  }
}
