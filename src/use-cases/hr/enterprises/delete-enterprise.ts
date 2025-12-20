import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EnterprisesRepository } from '@/repositories/hr/enterprises-repository';

export interface DeleteEnterpriseRequest {
  id: string;
}

export interface DeleteEnterpriseResponse {
  success: boolean;
}

export class DeleteEnterpriseUseCase {
  constructor(private enterprisesRepository: EnterprisesRepository) {}

  async execute(
    request: DeleteEnterpriseRequest,
  ): Promise<DeleteEnterpriseResponse> {
    await this.enterprisesRepository.delete(new UniqueEntityID(request.id));

    return { success: true };
  }
}
