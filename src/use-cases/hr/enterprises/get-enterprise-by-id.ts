import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Enterprise } from '@/entities/hr/enterprise';
import type { EnterprisesRepository } from '@/repositories/hr/enterprises-repository';

export interface GetEnterpriseByIdRequest {
  id: string;
}

export interface GetEnterpriseByIdResponse {
  enterprise: Enterprise | null;
}

export class GetEnterpriseByIdUseCase {
  constructor(private enterprisesRepository: EnterprisesRepository) {}

  async execute(
    request: GetEnterpriseByIdRequest,
  ): Promise<GetEnterpriseByIdResponse> {
    const enterprise = await this.enterprisesRepository.findById(
      new UniqueEntityID(request.id),
    );

    return { enterprise };
  }
}
