import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import type { ClosePosSessionUseCase } from './close-pos-session';

interface ClosePosSessionFromDeviceUseCaseRequest {
  tenantId: string;
  terminalId: string;
  sessionId: string;
  performedByEmployeeId: string;
  closingBalance: number;
  closingBreakdown?: {
    cash?: number;
    creditCard?: number;
    debitCard?: number;
    pix?: number;
    checks?: number;
    other?: number;
  };
  notes?: string;
}

/**
 * Device-token variant of `ClosePosSessionUseCase`. Validates that the
 * employee closing the session is an active operator on the terminal,
 * resolves their linked user account, then delegates to the standard close
 * use case.
 */
export class ClosePosSessionFromDeviceUseCase {
  constructor(
    private posTerminalOperatorsRepository: PosTerminalOperatorsRepository,
    private employeesRepository: EmployeesRepository,
    private closePosSessionUseCase: ClosePosSessionUseCase,
  ) {}

  async execute(request: ClosePosSessionFromDeviceUseCaseRequest) {
    const {
      tenantId,
      terminalId,
      sessionId,
      performedByEmployeeId,
      closingBalance,
      closingBreakdown,
      notes,
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
        'Operator employee has no linked user account. POS session requires the employee to be linked to a user.',
      );
    }

    return this.closePosSessionUseCase.execute({
      tenantId,
      sessionId,
      userId: employee.userId.toString(),
      closingBalance,
      closingBreakdown,
      notes,
    });
  }
}
