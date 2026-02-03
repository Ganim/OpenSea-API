import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction } from '@/entities/hr/deduction';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';

export interface ListDeductionsRequest {
  tenantId: string;
  employeeId?: string;
  isApplied?: boolean;
  isRecurring?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface ListDeductionsResponse {
  deductions: Deduction[];
}

export class ListDeductionsUseCase {
  constructor(private deductionsRepository: DeductionsRepository) {}

  async execute(
    request: ListDeductionsRequest,
  ): Promise<ListDeductionsResponse> {
    const { tenantId, employeeId, isApplied, isRecurring, startDate, endDate } =
      request;

    const deductions = await this.deductionsRepository.findMany(tenantId, {
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      isApplied,
      isRecurring,
      startDate,
      endDate,
    });

    return {
      deductions,
    };
  }
}
