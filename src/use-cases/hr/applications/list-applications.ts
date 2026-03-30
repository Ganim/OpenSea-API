import type { Application } from '@/entities/hr/application';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';

export interface ListApplicationsRequest {
  tenantId: string;
  jobPostingId?: string;
  candidateId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListApplicationsResponse {
  applications: Application[];
  total: number;
}

export class ListApplicationsUseCase {
  constructor(private applicationsRepository: ApplicationsRepository) {}

  async execute(
    request: ListApplicationsRequest,
  ): Promise<ListApplicationsResponse> {
    const { tenantId, ...filters } = request;

    const { applications, total } =
      await this.applicationsRepository.findMany(tenantId, filters);

    return { applications, total };
  }
}
