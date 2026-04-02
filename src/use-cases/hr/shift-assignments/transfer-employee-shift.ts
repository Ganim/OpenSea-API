import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ShiftAssignment } from '@/entities/hr/shift-assignment';
import { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';
import { ShiftsRepository } from '@/repositories/hr/shifts-repository';

export interface TransferEmployeeShiftRequest {
  tenantId: string;
  employeeId: string;
  newShiftId: string;
  startDate: Date;
  notes?: string;
}

export interface TransferEmployeeShiftResponse {
  newAssignment: ShiftAssignment;
}

export class TransferEmployeeShiftUseCase {
  constructor(
    private shiftsRepository: ShiftsRepository,
    private shiftAssignmentsRepository: ShiftAssignmentsRepository,
  ) {}

  async execute(
    request: TransferEmployeeShiftRequest,
  ): Promise<TransferEmployeeShiftResponse> {
    const { tenantId, employeeId, newShiftId, startDate, notes } = request;

    // Verify new shift exists and is active
    const newShift = await this.shiftsRepository.findById(
      new UniqueEntityID(newShiftId),
      tenantId,
    );

    if (!newShift) {
      throw new ResourceNotFoundError('Target shift not found');
    }

    if (!newShift.isActive) {
      throw new ConflictError('Cannot transfer to an inactive shift');
    }

    // Find and deactivate current assignment
    const currentAssignment =
      await this.shiftAssignmentsRepository.findActiveByEmployee(
        employeeId,
        tenantId,
      );

    if (currentAssignment) {
      if (currentAssignment.shiftId.toString() === newShiftId) {
        throw new ConflictError('Employee is already assigned to this shift');
      }
      await this.shiftAssignmentsRepository.deactivate(currentAssignment.id);
    }

    // Create new assignment
    const newAssignment = await this.shiftAssignmentsRepository.create({
      tenantId,
      shiftId: newShiftId,
      employeeId,
      startDate,
      isActive: true,
      notes,
    });

    return { newAssignment };
  }
}
