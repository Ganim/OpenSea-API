import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { DependantsRepository } from '@/repositories/hr/dependants-repository';

export interface DeleteDependantRequest {
  tenantId: string;
  dependantId: string;
}

export interface DeleteDependantResponse {
  dependant: EmployeeDependant;
}

export class DeleteDependantUseCase {
  constructor(private dependantsRepository: DependantsRepository) {}

  async execute(
    request: DeleteDependantRequest,
  ): Promise<DeleteDependantResponse> {
    const { tenantId, dependantId } = request;

    const dependant = await this.dependantsRepository.findById(
      new UniqueEntityID(dependantId),
      tenantId,
    );

    if (!dependant) {
      throw new ResourceNotFoundError('Dependente não encontrado');
    }

    await this.dependantsRepository.delete(new UniqueEntityID(dependantId));

    return { dependant };
  }
}
