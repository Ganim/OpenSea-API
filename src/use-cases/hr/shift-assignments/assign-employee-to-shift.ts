import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ShiftAssignment } from '@/entities/hr/shift-assignment';
import { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';
import { ShiftsRepository } from '@/repositories/hr/shifts-repository';

export interface AssignEmployeeToShiftRequest {
  tenantId: string;
  shiftId: string;
  employeeId: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface AssignEmployeeToShiftResponse {
  shiftAssignment: ShiftAssignment;
}

export class AssignEmployeeToShiftUseCase {
  constructor(
    private shiftsRepository: ShiftsRepository,
    private shiftAssignmentsRepository: ShiftAssignmentsRepository,
  ) {}

  async execute(
    request: AssignEmployeeToShiftRequest,
  ): Promise<AssignEmployeeToShiftResponse> {
    const { tenantId, shiftId, employeeId, startDate, endDate, notes } =
      request;

    // Verify shift exists
    const shift = await this.shiftsRepository.findById(
      new UniqueEntityID(shiftId),
      tenantId,
    );

    if (!shift) {
      throw new ResourceNotFoundError('Shift not found');
    }

    if (!shift.isActive) {
      throw new ConflictError('Cannot assign employee to an inactive shift');
    }

    // Check if employee already has an active assignment
    const existingAssignment =
      await this.shiftAssignmentsRepository.findActiveByEmployee(
        employeeId,
        tenantId,
      );

    if (existingAssignment) {
      throw new ConflictError(
        'Employee already has an active shift assignment. Remove or transfer the existing assignment first.',
      );
    }

    const shiftAssignment = await this.shiftAssignmentsRepository.create({
      tenantId,
      shiftId,
      employeeId,
      startDate,
      endDate,
      isActive: true,
      notes,
    });

    return { shiftAssignment };
  }
}
