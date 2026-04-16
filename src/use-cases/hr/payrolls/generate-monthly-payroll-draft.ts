import type { Payroll } from '@/entities/hr/payroll';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface GenerateMonthlyPayrollDraftRequest {
  tenantId: string;
  /**
   * Reference date used to derive the target month/year. Defaults to "now".
   * The cron schedule fires on the 25th — so by default the draft targets the
   * month currently being closed.
   */
  referenceDate?: Date;
}

export interface GenerateMonthlyPayrollDraftResponse {
  payroll: Payroll | null;
  referenceMonth: number;
  referenceYear: number;
  evaluatedEmployees: number;
  alreadyExisted: boolean;
}

/**
 * Generates a draft Payroll record for the tenant's current month if none
 * exists yet. The draft is intentionally created empty — the dedicated
 * {@link CalculatePayrollUseCase} owns line-item calculation (base salary,
 * benefits, bonuses, deductions, INSS, IRRF, FGTS, etc.) and is meant to be
 * triggered manually after this draft is produced, allowing payroll managers
 * to review the period before computation.
 *
 * Idempotent: repeated runs in the same month do not create duplicates.
 */
export class GenerateMonthlyPayrollDraftUseCase {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly payrollsRepository: PayrollsRepository,
  ) {}

  async execute(
    request: GenerateMonthlyPayrollDraftRequest,
  ): Promise<GenerateMonthlyPayrollDraftResponse> {
    const { tenantId } = request;
    const referenceDate = request.referenceDate ?? new Date();

    const referenceMonth = referenceDate.getMonth() + 1;
    const referenceYear = referenceDate.getFullYear();

    const activeEmployees =
      await this.employeesRepository.findManyActive(tenantId);

    if (activeEmployees.length === 0) {
      return {
        payroll: null,
        referenceMonth,
        referenceYear,
        evaluatedEmployees: 0,
        alreadyExisted: false,
      };
    }

    const existingPayroll = await this.payrollsRepository.findByPeriod(
      referenceMonth,
      referenceYear,
      tenantId,
    );

    if (existingPayroll) {
      return {
        payroll: existingPayroll,
        referenceMonth,
        referenceYear,
        evaluatedEmployees: activeEmployees.length,
        alreadyExisted: true,
      };
    }

    const draftPayroll = await this.payrollsRepository.create({
      tenantId,
      referenceMonth,
      referenceYear,
      totalGross: 0,
      totalDeductions: 0,
    });

    return {
      payroll: draftPayroll,
      referenceMonth,
      referenceYear,
      evaluatedEmployees: activeEmployees.length,
      alreadyExisted: false,
    };
  }
}
