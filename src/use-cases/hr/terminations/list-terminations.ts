import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Termination } from '@/entities/hr/termination';
import type {
  TerminationStatus,
  TerminationType,
} from '@/entities/hr/termination';
import { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface ListTerminationsRequest {
  tenantId: string;
  employeeId?: string;
  status?: TerminationStatus;
  type?: TerminationType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  perPage?: number;
}

export interface ListTerminationsResponse {
  terminations: Termination[];
  total: number;
}

export class ListTerminationsUseCase {
  constructor(private terminationsRepository: TerminationsRepository) {}

  async execute(
    request: ListTerminationsRequest,
  ): Promise<ListTerminationsResponse> {
    const {
      tenantId,
      employeeId,
      status,
      type,
      startDate,
      endDate,
      page,
      perPage,
    } = request;

    const filters = {
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      status,
      type,
      startDate,
      endDate,
      page,
      perPage,
    };

    const [terminations, total] = await Promise.all([
      this.terminationsRepository.findMany(tenantId, filters),
      this.terminationsRepository.countMany(tenantId, filters),
    ]);

    return { terminations, total };
  }
}
