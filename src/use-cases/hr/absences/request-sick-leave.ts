import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface RequestSickLeaveRequest {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  documentUrl?: string;
  cid?: string;
  requestedBy?: string;
}

export interface RequestSickLeaveResponse {
  absence: Absence;
}

export class RequestSickLeaveUseCase {
  constructor(
    private absencesRepository: AbsencesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: RequestSickLeaveRequest,
  ): Promise<RequestSickLeaveResponse> {
    const {
      employeeId,
      startDate,
      endDate,
      reason,
      documentUrl,
      cid,
      requestedBy,
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify employee is active
    if (!employee.status.isActive()) {
      throw new Error('Funcionário não está ativo');
    }

    // Validate CID is required for sick leave
    if (!cid) {
      throw new Error('Código CID é obrigatório para atestados médicos');
    }

    // Calculate total days
    const totalDays = this.calculateDays(startDate, endDate);

    // Validate that end date is after start date
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }

    // Check for overlapping absences
    const overlapping = await this.absencesRepository.findOverlapping(
      new UniqueEntityID(employeeId),
      startDate,
      endDate,
    );

    if (overlapping.length > 0) {
      throw new Error('There is already an absence registered for this period');
    }

    // Determine if it's paid (first 15 days are paid by employer in Brazil)
    const isPaid = totalDays <= 15;

    // Determine if INSS is responsible (after 15 days)
    const isInssResponsibility = totalDays > 15;

    // Create sick leave absence (auto-approved since it has medical certificate)
    const absence = await this.absencesRepository.create({
      employeeId: new UniqueEntityID(employeeId),
      type: 'SICK_LEAVE',
      startDate,
      endDate,
      totalDays,
      reason,
      documentUrl,
      cid,
      isPaid,
      isInssResponsibility,
      requestedBy: requestedBy ? new UniqueEntityID(requestedBy) : undefined,
      notes: isInssResponsibility
        ? 'INSS responsibility after 15 days'
        : undefined,
    });

    return {
      absence,
    };
  }

  private calculateDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }
}
