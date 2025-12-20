import type { EnterprisesRepository } from '@/repositories/hr/enterprises-repository';
import { Enterprise } from '@/entities/hr/enterprise';

export interface ListEnterprisesRequest {
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
}

export interface ListEnterprisesResponse {
  enterprises: Enterprise[];
  total: number;
  page: number;
  perPage: number;
}

export class ListEnterprisesUseCase {
  constructor(private enterprisesRepository: EnterprisesRepository) {}

  async execute(
    request: ListEnterprisesRequest,
  ): Promise<ListEnterprisesResponse> {
    const {
      page = 1,
      perPage = 20,
      search,
      includeDeleted = false,
    } = request;

    const { enterprises, total } =
      await this.enterprisesRepository.findMany({
        page,
        perPage,
        search,
        includeDeleted,
      });

    return {
      enterprises,
      total,
      page,
      perPage,
    };
  }
}
