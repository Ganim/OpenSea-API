import type { ShiftAssignment } from '@/entities/hr/shift-assignment';
import { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';

export interface ListAssignmentsByShiftRequest {
  shiftId: string;
  tenantId: string;
}

export interface ListAssignmentsByShiftResponse {
  shiftAssignments: ShiftAssignment[];
}

export class ListAssignmentsByShiftUseCase {
  constructor(
    private shiftAssignmentsRepository: ShiftAssignmentsRepository,
  ) {}

  async execute(
    request: ListAssignmentsByShiftRequest,
  ): Promise<ListAssignmentsByShiftResponse> {
    const { shiftId, tenantId } = request;

    const shiftAssignments =
      await this.shiftAssignmentsRepository.findManyByShift(shiftId, tenantId);

    return { shiftAssignments };
  }
}
