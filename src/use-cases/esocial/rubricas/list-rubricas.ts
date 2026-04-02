import { EsocialRubrica } from '@/entities/esocial/esocial-rubrica';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';

export interface ListRubricasRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  type?: number;
  isActive?: boolean;
}

export interface ListRubricasResponse {
  rubricas: EsocialRubrica[];
  total: number;
}

export class ListRubricasUseCase {
  constructor(private rubricasRepository: EsocialRubricasRepository) {}

  async execute(request: ListRubricasRequest): Promise<ListRubricasResponse> {
    const { rubricas, total } = await this.rubricasRepository.findMany({
      tenantId: request.tenantId,
      page: request.page,
      perPage: request.perPage,
      search: request.search,
      type: request.type,
      isActive: request.isActive,
    });

    return { rubricas, total };
  }
}
