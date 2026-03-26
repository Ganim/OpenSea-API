import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { checkEmploymentStability } from './check-employment-stability';

export interface TerminateEmployeeRequest {
  tenantId: string;
  employeeId: string;
  terminationDate: Date;
  reason?: string;
  /** Se true, ignora verificação de estabilidade (justa causa, falecimento) */
  forceTermination?: boolean;
}

export interface TerminateEmployeeResponse {
  employee: Employee;
}

/** Tipos de rescisão que não respeitam estabilidade provisória */
const STABILITY_EXEMPT_REASONS = ['JUSTA_CAUSA', 'FALECIMENTO'];

export class TerminateEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: TerminateEmployeeRequest,
  ): Promise<TerminateEmployeeResponse> {
    const {
      tenantId,
      employeeId,
      terminationDate,
      reason,
      forceTermination = false,
    } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    // Check if employee is already terminated
    if (employee.status.value === 'TERMINATED') {
      throw new BadRequestError('Employee is already terminated');
    }

    // Check employment stability (gestante, acidente de trabalho, CIPA)
    if (!forceTermination && !STABILITY_EXEMPT_REASONS.includes(reason ?? '')) {
      const stability = checkEmploymentStability(employee);
      if (stability.isStable) {
        const stableUntilMsg = stability.stableUntil
          ? ` Estável até ${stability.stableUntil.toLocaleDateString('pt-BR')}.`
          : '';
        throw new BadRequestError(
          `Funcionário possui estabilidade provisória: ${stability.reason}.${stableUntilMsg} Rescisão sem justa causa ou acordo mútuo bloqueada.`,
        );
      }
    }

    // Update employee status and termination date
    const updatedEmployee = await this.employeesRepository.update({
      id: new UniqueEntityID(employeeId),
      status: EmployeeStatus.TERMINATED(),
      terminationDate,
      metadata: {
        ...employee.metadata,
        terminationReason: reason,
        terminatedAt: new Date().toISOString(),
      },
    });

    if (!updatedEmployee) {
      throw new BadRequestError('Failed to terminate employee');
    }

    return {
      employee: updatedEmployee,
    };
  }
}
