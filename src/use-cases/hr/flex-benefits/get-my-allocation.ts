import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FlexBenefitAllocation } from '@/entities/hr/flex-benefit-allocation';
import type { FlexBenefitAllocationsRepository } from '@/repositories/hr/flex-benefit-allocations-repository';

export interface GetMyAllocationRequest {
  tenantId: string;
  employeeId: string;
  month?: number;
  year?: number;
}

export interface GetMyAllocationResponse {
  allocation: FlexBenefitAllocation | null;
}

export class GetMyAllocationUseCase {
  constructor(
    private flexBenefitAllocationsRepository: FlexBenefitAllocationsRepository,
  ) {}

  async execute(
    request: GetMyAllocationRequest,
  ): Promise<GetMyAllocationResponse> {
    const { tenantId, employeeId } = request;

    const now = new Date();
    const month = request.month ?? now.getMonth() + 1;
    const year = request.year ?? now.getFullYear();

    const allocation =
      await this.flexBenefitAllocationsRepository.findByEmployeeAndMonth(
        new UniqueEntityID(employeeId),
        month,
        year,
        tenantId,
      );

    return { allocation };
  }
}
