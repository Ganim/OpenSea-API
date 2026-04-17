import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { CipaMembersRepository } from '@/repositories/hr/cipa-members-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { checkEmploymentStability } from './check-employment-stability';
import { isStabilityExemptReason } from './stability-exempt-reasons';

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

export class TerminateEmployeeUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private cipaMembersRepository?: CipaMembersRepository,
  ) {}

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
    if (!forceTermination && !isStabilityExemptReason(reason)) {
      const activeCipaMembers = await this.cipaMembersRepository
        ?.findActiveByEmployeeId(new UniqueEntityID(employeeId), tenantId)
        .catch(() => undefined);
      const stability = checkEmploymentStability(employee, activeCipaMembers);
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
