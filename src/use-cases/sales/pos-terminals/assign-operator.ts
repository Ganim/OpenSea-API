import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

export interface AssignOperatorRequest {
  tenantId: string;
  terminalId: string;
  employeeId: string;
  assignedByUserId: string;
}

export interface AssignOperatorResponse {
  operator: PosTerminalOperator;
}

/**
 * Assigns an Employee as an authorized operator of a POS Terminal.
 *
 * Behavior:
 *  - 404 if the terminal does not exist within the tenant
 *  - 404 if the employee does not exist within the tenant
 *  - 400 if an ACTIVE link already exists between this terminal+employee
 *  - Reactivates an existing REVOKED link (keeps the same row, due to the
 *    UNIQUE(terminal_id, employee_id) constraint), updating assignedAt /
 *    assignedByUserId and clearing the revocation metadata.
 *
 * Used by the Emporion POS admin flow to authorize which employees can sign
 * in as operators on each terminal. Protected by `sales.pos.admin` permission.
 */
export class AssignOperatorUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private employeesRepository: EmployeesRepository,
    private operatorsRepository: PosTerminalOperatorsRepository,
  ) {}

  async execute(
    request: AssignOperatorRequest,
  ): Promise<AssignOperatorResponse> {
    const { tenantId, terminalId, employeeId, assignedByUserId } = request;

    const terminalUniqueId = new UniqueEntityID(terminalId);
    const employeeUniqueId = new UniqueEntityID(employeeId);
    const assignedByUniqueId = new UniqueEntityID(assignedByUserId);

    const terminal = await this.posTerminalsRepository.findById(
      terminalUniqueId,
      tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('POS terminal not found');
    }

    const employee = await this.employeesRepository.findById(
      employeeUniqueId,
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee not found');
    }

    const existingOperator =
      await this.operatorsRepository.findByTerminalAndEmployee(
        terminalUniqueId,
        employeeUniqueId,
        tenantId,
      );

    let operator: PosTerminalOperator;

    if (existingOperator) {
      if (existingOperator.isActive) {
        throw new BadRequestError(
          'Employee is already an active operator of this terminal',
        );
      }

      existingOperator.reactivate(assignedByUniqueId);
      await this.operatorsRepository.save(existingOperator);
      operator = existingOperator;
    } else {
      operator = PosTerminalOperator.create({
        terminalId: terminalUniqueId,
        employeeId: employeeUniqueId,
        tenantId,
        assignedByUserId: assignedByUniqueId,
      });

      await this.operatorsRepository.create(operator);
    }

    queueAuditLog({
      userId: assignedByUserId,
      action: 'POS_OPERATOR_ASSIGN',
      entity: 'POS_TERMINAL_OPERATOR',
      entityId: operator.id.toString(),
      module: 'SALES',
      description: `Assigned employee ${employeeId} as operator of POS terminal ${terminalId}`,
      newData: {
        terminalId,
        employeeId,
        assignedByUserId,
        isActive: operator.isActive,
        reactivated: Boolean(existingOperator),
      },
    }).catch(() => {});

    return { operator };
  }
}
