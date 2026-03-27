import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FlexBenefitAllocation } from '@/entities/hr/flex-benefit-allocation';
import type { FlexBenefitAllocationsRepository } from '@/repositories/hr/flex-benefit-allocations-repository';

export interface ListAllocationHistoryRequest {
  tenantId: string;
  employeeId?: string;
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListAllocationHistoryResponse {
  allocations: FlexBenefitAllocation[];
  total: number;
}

export class ListAllocationHistoryUseCase {
  constructor(
    private flexBenefitAllocationsRepository: FlexBenefitAllocationsRepository,
  ) {}

  async execute(
    request: ListAllocationHistoryRequest,
  ): Promise<ListAllocationHistoryResponse> {
    const { tenantId, employeeId, month, year, status, page, perPage } =
      request;

    const { allocations, total } =
      await this.flexBenefitAllocationsRepository.findMany(tenantId, {
        employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
        month,
        year,
        status,
        page,
        perPage,
      });

    return { allocations, total };
  }
}
