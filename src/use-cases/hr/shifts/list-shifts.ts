import type { Shift } from '@/entities/hr/shift';
import { ShiftsRepository } from '@/repositories/hr/shifts-repository';

export interface ListShiftsRequest {
  tenantId: string;
  activeOnly?: boolean;
}

export interface ListShiftsResponse {
  shifts: Shift[];
}

export class ListShiftsUseCase {
  constructor(private shiftsRepository: ShiftsRepository) {}

  async execute(request: ListShiftsRequest): Promise<ListShiftsResponse> {
    const { tenantId, activeOnly } = request;

    const shifts = activeOnly
      ? await this.shiftsRepository.findManyActive(tenantId)
      : await this.shiftsRepository.findMany(tenantId);

    return { shifts };
  }
}
