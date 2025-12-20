import type { EnterprisesRepository } from '@/repositories/hr/enterprises-repository';

export interface GetEnterpriseByCnpjRequest {
  cnpj: string;
  includeDeleted?: boolean;
}

export interface GetEnterpriseByCnpjResponse {
  exists: boolean;
  enterpriseId?: string;
}

export class GetEnterpriseByCnpjUseCase {
  constructor(private enterprisesRepository: EnterprisesRepository) {}

  async execute(
    request: GetEnterpriseByCnpjRequest,
  ): Promise<GetEnterpriseByCnpjResponse> {
    const enterprise = await this.enterprisesRepository.findByCnpj(
      request.cnpj,
      request.includeDeleted,
    );

    if (!enterprise) {
      return { exists: false };
    }

    return { exists: true, enterpriseId: enterprise.id.toString() };
  }
}
