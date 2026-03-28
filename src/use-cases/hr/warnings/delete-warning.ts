import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface DeleteWarningRequest {
  tenantId: string;
  warningId: string;
}

export class DeleteWarningUseCase {
  constructor(private employeeWarningsRepository: EmployeeWarningsRepository) {}

  async execute(request: DeleteWarningRequest): Promise<void> {
    const { tenantId, warningId } = request;

    const warning = await this.employeeWarningsRepository.findById(
      new UniqueEntityID(warningId),
      tenantId,
    );

    if (!warning) {
      throw new ResourceNotFoundError('Warning');
    }

    await this.employeeWarningsRepository.delete(
      new UniqueEntityID(warningId),
      tenantId,
    );
  }
}
