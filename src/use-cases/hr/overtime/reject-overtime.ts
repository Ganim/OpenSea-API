import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';

export interface RejectOvertimeRequest {
  tenantId: string;
  overtimeId: string;
  rejectedBy: string;
  rejectionReason?: string;
}

export interface RejectOvertimeResponse {
  overtime: Overtime;
}

export class RejectOvertimeUseCase {
  constructor(private overtimeRepository: OvertimeRepository) {}

  async execute(
    request: RejectOvertimeRequest,
  ): Promise<RejectOvertimeResponse> {
    const { tenantId, overtimeId, rejectedBy, rejectionReason } = request;

    // Find overtime request
    const overtime = await this.overtimeRepository.findById(
      new UniqueEntityID(overtimeId),
      tenantId,
    );
    if (!overtime) {
      throw new ResourceNotFoundError('Overtime request not found');
    }

    // Check if already approved
    if (overtime.approved) {
      throw new BadRequestError(
        'Cannot reject an already approved overtime request',
      );
    }

    // Check if already rejected
    if (overtime.rejected) {
      throw new BadRequestError('Overtime request is already rejected');
    }

    // Reject overtime
    overtime.reject(new UniqueEntityID(rejectedBy), rejectionReason);
    await this.overtimeRepository.save(overtime);

    return {
      overtime,
    };
  }
}
