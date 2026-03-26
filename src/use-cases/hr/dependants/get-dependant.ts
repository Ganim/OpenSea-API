import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { DependantsRepository } from '@/repositories/hr/dependants-repository';

export interface GetDependantRequest {
  tenantId: string;
  dependantId: string;
}

export interface GetDependantResponse {
  dependant: EmployeeDependant;
}

export class GetDependantUseCase {
  constructor(private dependantsRepository: DependantsRepository) {}

  async execute(
    request: GetDependantRequest,
  ): Promise<GetDependantResponse> {
    const { tenantId, dependantId } = request;

    const dependant = await this.dependantsRepository.findById(
      new UniqueEntityID(dependantId),
      tenantId,
    );

    if (!dependant) {
      throw new ResourceNotFoundError('Dependente não encontrado');
    }

    return { dependant };
  }
}
