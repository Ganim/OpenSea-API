import type { Payroll } from '@/entities/hr/payroll';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface ListPayrollsRequest {
  referenceMonth?: number;
  referenceYear?: number;
  status?: string;
}

export interface ListPayrollsResponse {
  payrolls: Payroll[];
}

export class ListPayrollsUseCase {
  constructor(private payrollsRepository: PayrollsRepository) {}

  async execute(request: ListPayrollsRequest): Promise<ListPayrollsResponse> {
    const { referenceMonth, referenceYear, status } = request;

    const payrolls = await this.payrollsRepository.findMany({
      referenceMonth,
      referenceYear,
      status,
    });

    return {
      payrolls,
    };
  }
}
