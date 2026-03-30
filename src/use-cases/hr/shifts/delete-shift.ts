import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ShiftsRepository } from '@/repositories/hr/shifts-repository';

export interface DeleteShiftRequest {
  shiftId: string;
  tenantId: string;
}

export class DeleteShiftUseCase {
  constructor(private shiftsRepository: ShiftsRepository) {}

  async execute(request: DeleteShiftRequest): Promise<void> {
    const { shiftId, tenantId } = request;

    const shift = await this.shiftsRepository.findById(
      new UniqueEntityID(shiftId),
      tenantId,
    );

    if (!shift) {
      throw new ResourceNotFoundError('Shift not found');
    }

    // Check if shift has active assignments
    const activeAssignmentCount = await this.shiftsRepository.countAssignments(
      shift.id,
    );

    if (activeAssignmentCount > 0) {
      throw new BadRequestError(
        'Cannot delete a shift that has active assignments. Remove all assignments first.',
      );
    }

    await this.shiftsRepository.softDelete(shift.id);
  }
}
