import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';

export interface ListOvertimeRequest {
  tenantId: string;
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  approved?: boolean;
}

export interface ListOvertimeResponse {
  overtimes: Overtime[];
  total: number;
}

export class ListOvertimeUseCase {
  constructor(private overtimeRepository: OvertimeRepository) {}

  async execute(request: ListOvertimeRequest): Promise<ListOvertimeResponse> {
    const { tenantId, employeeId, startDate, endDate, approved } = request;

    const overtimes = await this.overtimeRepository.findMany(tenantId, {
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      startDate,
      endDate,
      approved,
    });

    return {
      overtimes,
      total: overtimes.length,
    };
  }
}
