import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Shift } from '@/entities/hr/shift';
import { ShiftsRepository } from '@/repositories/hr/shifts-repository';

export interface GetShiftRequest {
  shiftId: string;
  tenantId: string;
}

export interface GetShiftResponse {
  shift: Shift;
  assignmentCount: number;
}

export class GetShiftUseCase {
  constructor(private shiftsRepository: ShiftsRepository) {}

  async execute(request: GetShiftRequest): Promise<GetShiftResponse> {
    const { shiftId, tenantId } = request;

    const shift = await this.shiftsRepository.findById(
      new UniqueEntityID(shiftId),
      tenantId,
    );

    if (!shift) {
      throw new ResourceNotFoundError('Shift not found');
    }

    const assignmentCount = await this.shiftsRepository.countAssignments(
      shift.id,
    );

    return { shift, assignmentCount };
  }
}
