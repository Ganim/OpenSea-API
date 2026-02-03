import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';

export interface RequestOvertimeRequest {
  tenantId: string;
  employeeId: string;
  date: Date;
  hours: number;
  reason: string;
}

export interface RequestOvertimeResponse {
  overtime: Overtime;
}

export class RequestOvertimeUseCase {
  constructor(
    private overtimeRepository: OvertimeRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: RequestOvertimeRequest,
  ): Promise<RequestOvertimeResponse> {
    const { tenantId, employeeId, date, hours, reason } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify employee is active
    if (!employee.status.isActive()) {
      throw new Error('Employee is not active');
    }

    // Validate hours
    if (hours <= 0) {
      throw new Error('Hours must be greater than 0');
    }

    if (hours > 12) {
      throw new Error('Hours cannot exceed 12 hours per request');
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      throw new Error('Reason must be at least 10 characters');
    }

    // Create overtime request
    const overtime = await this.overtimeRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      date,
      hours,
      reason: reason.trim(),
    });

    return {
      overtime,
    };
  }
}
