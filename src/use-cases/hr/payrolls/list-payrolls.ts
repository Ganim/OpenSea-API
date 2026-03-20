import type { Payroll } from '@/entities/hr/payroll';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface ListPayrollsRequest {
  tenantId: string;
  referenceMonth?: number;
  referenceYear?: number;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListPayrollsResponse {
  payrolls: Payroll[];
}

export class ListPayrollsUseCase {
  constructor(private payrollsRepository: PayrollsRepository) {}

  async execute(request: ListPayrollsRequest): Promise<ListPayrollsResponse> {
    const { tenantId, referenceMonth, referenceYear, status, page, perPage } =
      request;

    const payrolls = await this.payrollsRepository.findMany(tenantId, {
      referenceMonth,
      referenceYear,
      status,
      page,
      perPage,
    });

    return {
      payrolls,
    };
  }
}
