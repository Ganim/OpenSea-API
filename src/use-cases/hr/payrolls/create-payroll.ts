import type { Payroll } from '@/entities/hr/payroll';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface CreatePayrollRequest {
  tenantId: string;
  referenceMonth: number;
  referenceYear: number;
}

export interface CreatePayrollResponse {
  payroll: Payroll;
}

export class CreatePayrollUseCase {
  constructor(private payrollsRepository: PayrollsRepository) {}

  async execute(request: CreatePayrollRequest): Promise<CreatePayrollResponse> {
    const { tenantId, referenceMonth, referenceYear } = request;

    // Validate month
    if (referenceMonth < 1 || referenceMonth > 12) {
      throw new Error('Mês de referência inválido');
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (referenceYear < currentYear - 5 || referenceYear > currentYear + 1) {
      throw new Error('Ano de referência inválido');
    }

    // Check if payroll already exists for this period
    const existingPayroll = await this.payrollsRepository.findByPeriod(
      referenceMonth,
      referenceYear,
      tenantId,
    );

    if (existingPayroll) {
      throw new Error(
        `Já existe uma folha de pagamento para ${referenceMonth}/${referenceYear}`,
      );
    }

    // Create the payroll
    const payroll = await this.payrollsRepository.create({
      tenantId,
      referenceMonth,
      referenceYear,
    });

    return {
      payroll,
    };
  }
}
