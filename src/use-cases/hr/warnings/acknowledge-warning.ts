import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface AcknowledgeWarningRequest {
  tenantId: string;
  warningId: string;
}

export interface AcknowledgeWarningResponse {
  warning: EmployeeWarning;
}

export class AcknowledgeWarningUseCase {
  constructor(private employeeWarningsRepository: EmployeeWarningsRepository) {}

  async execute(
    request: AcknowledgeWarningRequest,
  ): Promise<AcknowledgeWarningResponse> {
    const { tenantId, warningId } = request;

    const warning = await this.employeeWarningsRepository.findById(
      new UniqueEntityID(warningId),
      tenantId,
    );

    if (!warning) {
      throw new ResourceNotFoundError('Warning');
    }

    if (!warning.isActive()) {
      throw new BadRequestError(
        'Somente advertências ativas podem ser reconhecidas',
      );
    }

    if (warning.hasBeenAcknowledged()) {
      throw new BadRequestError('Advertência já foi reconhecida');
    }

    warning.acknowledge();

    await this.employeeWarningsRepository.save(warning);

    return { warning };
  }
}
