import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';

export interface UnassignEmployeeFromShiftRequest {
  assignmentId: string;
  tenantId: string;
}

export class UnassignEmployeeFromShiftUseCase {
  constructor(private shiftAssignmentsRepository: ShiftAssignmentsRepository) {}

  async execute(request: UnassignEmployeeFromShiftRequest): Promise<void> {
    const { assignmentId, tenantId } = request;

    const assignment = await this.shiftAssignmentsRepository.findById(
      new UniqueEntityID(assignmentId),
      tenantId,
    );

    if (!assignment) {
      throw new ResourceNotFoundError('Shift assignment not found');
    }

    await this.shiftAssignmentsRepository.deactivate(
      new UniqueEntityID(assignmentId),
    );
  }
}
