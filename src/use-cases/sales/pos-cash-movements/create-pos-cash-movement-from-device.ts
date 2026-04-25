import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import type { CreatePosCashMovementUseCase } from './create-pos-cash-movement';

interface CreatePosCashMovementFromDeviceRequest {
  tenantId: string;
  terminalId: string;
  sessionId: string;
  type: 'WITHDRAWAL' | 'SUPPLY';
  amount: number;
  reason?: string;
  performedByEmployeeId: string;
}

/**
 * Device-token variant of `CreatePosCashMovementUseCase`. Validates that the
 * employee performing the movement is an active operator on the terminal,
 * resolves their linked user account, then delegates to the standard
 * cash-movement use case.
 */
export class CreatePosCashMovementFromDeviceUseCase {
  constructor(
    private posTerminalOperatorsRepository: PosTerminalOperatorsRepository,
    private employeesRepository: EmployeesRepository,
    private createPosCashMovementUseCase: CreatePosCashMovementUseCase,
  ) {}

  async execute(request: CreatePosCashMovementFromDeviceRequest) {
    const {
      tenantId,
      terminalId,
      sessionId,
      type,
      amount,
      reason,
      performedByEmployeeId,
    } = request;

    const operatorLink =
      await this.posTerminalOperatorsRepository.findByTerminalAndEmployee(
        new UniqueEntityID(terminalId),
        new UniqueEntityID(performedByEmployeeId),
        tenantId,
      );

    if (!operatorLink || !operatorLink.isActive) {
      throw new BadRequestError(
        'Employee is not assigned as an active operator for this terminal.',
      );
    }

    const employees = await this.employeesRepository.findManyByIds(
      [new UniqueEntityID(performedByEmployeeId)],
      tenantId,
    );
    const employee = employees[0];

    if (!employee) {
      throw new ResourceNotFoundError('Operator employee not found.');
    }

    if (!employee.userId) {
      throw new BadRequestError(
        'Operator employee has no linked user account. Cash movement requires the employee to be linked to a user.',
      );
    }

    return this.createPosCashMovementUseCase.execute({
      tenantId,
      sessionId,
      type,
      amount,
      reason,
      performedByUserId: employee.userId.toString(),
    });
  }
}
