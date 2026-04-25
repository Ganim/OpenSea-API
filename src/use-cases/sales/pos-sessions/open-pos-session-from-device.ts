import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import type { OpenPosSessionUseCase } from './open-pos-session';

interface OpenPosSessionFromDeviceUseCaseRequest {
  tenantId: string;
  terminalId: string;
  operatorEmployeeId: string;
  openingBalance: number;
}

/**
 * Device-token variant of `OpenPosSessionUseCase`. Used by Emporion (the
 * desktop terminal) which authenticates via device-token rather than user
 * JWT. The operator is identified by their `employeeId`; the use case:
 *
 *  1. Validates that the employee is registered as an active operator on
 *     the terminal (`PosTerminalOperator`).
 *  2. Resolves the employee → `userId` (employees that operate POS sessions
 *     must have a linked User account so the existing PosSession FK still
 *     points to a real user).
 *  3. Delegates to the standard `OpenPosSessionUseCase`.
 *
 * Mirrors the JWT flow's behaviour for orphan sessions, terminal validity
 * and opening cash movement persistence — those concerns stay encapsulated
 * in the underlying use case.
 */
export class OpenPosSessionFromDeviceUseCase {
  constructor(
    private posTerminalOperatorsRepository: PosTerminalOperatorsRepository,
    private employeesRepository: EmployeesRepository,
    private openPosSessionUseCase: OpenPosSessionUseCase,
  ) {}

  async execute(request: OpenPosSessionFromDeviceUseCaseRequest) {
    const { tenantId, terminalId, operatorEmployeeId, openingBalance } =
      request;

    const operatorLink =
      await this.posTerminalOperatorsRepository.findByTerminalAndEmployee(
        new UniqueEntityID(terminalId),
        new UniqueEntityID(operatorEmployeeId),
        tenantId,
      );

    if (!operatorLink || !operatorLink.isActive) {
      throw new BadRequestError(
        'Employee is not assigned as an active operator for this terminal.',
      );
    }

    const employees = await this.employeesRepository.findManyByIds(
      [new UniqueEntityID(operatorEmployeeId)],
      tenantId,
    );
    const employee = employees[0];

    if (!employee) {
      throw new ResourceNotFoundError('Operator employee not found.');
    }

    if (!employee.userId) {
      throw new BadRequestError(
        'Operator employee has no linked user account. POS session requires the employee to be linked to a user.',
      );
    }

    return this.openPosSessionUseCase.execute({
      tenantId,
      terminalId,
      operatorUserId: employee.userId.toString(),
      openingBalance,
    });
  }
}
