import type { ShiftAssignment } from '@/entities/hr/shift-assignment';
import { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';

export interface ListAssignmentsByEmployeeRequest {
  employeeId: string;
  tenantId: string;
}

export interface ListAssignmentsByEmployeeResponse {
  shiftAssignments: ShiftAssignment[];
}

export class ListAssignmentsByEmployeeUseCase {
  constructor(
    private shiftAssignmentsRepository: ShiftAssignmentsRepository,
  ) {}

  async execute(
    request: ListAssignmentsByEmployeeRequest,
  ): Promise<ListAssignmentsByEmployeeResponse> {
    const { employeeId, tenantId } = request;

    const shiftAssignments =
      await this.shiftAssignmentsRepository.findManyByEmployee(
        employeeId,
        tenantId,
      );

    return { shiftAssignments };
  }
}
