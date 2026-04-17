import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface AcknowledgeWarningRequest {
  tenantId: string;
  warningId: string;
  /**
   * `userId` do chamador autenticado (JWT `sub`). Obrigatório para garantir
   * que apenas o próprio funcionário advertido possa reconhecer a advertência
   * — evita falsificação de ciência em casos de Art. 482 CLT.
   */
  callerUserId: string;
}

export interface AcknowledgeWarningResponse {
  warning: EmployeeWarning;
}

export class AcknowledgeWarningUseCase {
  constructor(
    private employeeWarningsRepository: EmployeeWarningsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: AcknowledgeWarningRequest,
  ): Promise<AcknowledgeWarningResponse> {
    const { tenantId, warningId, callerUserId } = request;

    const warning = await this.employeeWarningsRepository.findById(
      new UniqueEntityID(warningId),
      tenantId,
    );

    if (!warning) {
      throw new ResourceNotFoundError('Warning');
    }

    const warningEmployee = await this.employeesRepository.findById(
      warning.employeeId,
      tenantId,
    );

    if (!warningEmployee) {
      throw new ResourceNotFoundError('Employee');
    }

    if (
      !warningEmployee.userId ||
      warningEmployee.userId.toString() !== callerUserId
    ) {
      throw new ForbiddenError(
        'Apenas o funcionário advertido pode reconhecer esta advertência',
      );
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
