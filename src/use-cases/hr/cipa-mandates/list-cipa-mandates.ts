import type { CipaMandate } from '@/entities/hr/cipa-mandate';
import { CipaMandatesRepository } from '@/repositories/hr/cipa-mandates-repository';

export interface ListCipaMandatesRequest {
  tenantId: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListCipaMandatesResponse {
  cipaMandates: CipaMandate[];
}

export class ListCipaMandatesUseCase {
  constructor(private cipaMandatesRepository: CipaMandatesRepository) {}

  async execute(
    request: ListCipaMandatesRequest,
  ): Promise<ListCipaMandatesResponse> {
    const { tenantId, status, page, perPage } = request;

    const cipaMandates = await this.cipaMandatesRepository.findMany(tenantId, {
      status,
      page,
      perPage,
    });

    return { cipaMandates };
  }
}
