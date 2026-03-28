import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface GetWarningRequest {
  tenantId: string;
  warningId: string;
}

export interface GetWarningResponse {
  warning: EmployeeWarning;
}

export class GetWarningUseCase {
  constructor(private employeeWarningsRepository: EmployeeWarningsRepository) {}

  async execute(request: GetWarningRequest): Promise<GetWarningResponse> {
    const { tenantId, warningId } = request;

    const warning = await this.employeeWarningsRepository.findById(
      new UniqueEntityID(warningId),
      tenantId,
    );

    if (!warning) {
      throw new ResourceNotFoundError('Warning');
    }

    return { warning };
  }
}
