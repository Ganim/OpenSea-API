import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';

export interface GetOvertimeRequest {
  id: string;
}

export interface GetOvertimeResponse {
  overtime: Overtime;
}

export class GetOvertimeUseCase {
  constructor(private overtimeRepository: OvertimeRepository) {}

  async execute(request: GetOvertimeRequest): Promise<GetOvertimeResponse> {
    const { id } = request;

    const overtime = await this.overtimeRepository.findById(
      new UniqueEntityID(id),
    );

    if (!overtime) {
      throw new Error('Overtime request not found');
    }

    return {
      overtime,
    };
  }
}
