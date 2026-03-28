import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface RevokeWarningRequest {
  tenantId: string;
  warningId: string;
  revokeReason: string;
}

export interface RevokeWarningResponse {
  warning: EmployeeWarning;
}

export class RevokeWarningUseCase {
  constructor(private employeeWarningsRepository: EmployeeWarningsRepository) {}

  async execute(request: RevokeWarningRequest): Promise<RevokeWarningResponse> {
    const { tenantId, warningId, revokeReason } = request;

    const warning = await this.employeeWarningsRepository.findById(
      new UniqueEntityID(warningId),
      tenantId,
    );

    if (!warning) {
      throw new ResourceNotFoundError('Warning');
    }

    if (!warning.status.canBeRevoked()) {
      throw new BadRequestError(
        'Somente advertências ativas podem ser revogadas',
      );
    }

    warning.revoke(revokeReason);

    await this.employeeWarningsRepository.save(warning);

    return { warning };
  }
}
