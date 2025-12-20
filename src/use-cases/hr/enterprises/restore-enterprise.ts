import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EnterprisesRepository } from '@/repositories/hr/enterprises-repository';

export interface RestoreEnterpriseRequest {
  id: string;
}

export interface RestoreEnterpriseResponse {
  success: boolean;
}

export class RestoreEnterpriseUseCase {
  constructor(private enterprisesRepository: EnterprisesRepository) {}

  async execute(
    request: RestoreEnterpriseRequest,
  ): Promise<RestoreEnterpriseResponse> {
    await this.enterprisesRepository.restore(new UniqueEntityID(request.id));

    return { success: true };
  }
}
