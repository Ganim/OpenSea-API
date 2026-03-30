import type { DependantsRepository } from '@/repositories/hr/dependants-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface GenerateDirfReportRequest {
  tenantId: string;
  year: number;
}

export interface DirfEmployeeRecord {
  registrationNumber: string;
  fullName: string;
  cpf: string;
  monthlyIncome: { month: number; grossIncome: number; irrfWithheld: number }[];
  annualGrossIncome: number;
  annualIrrfWithheld: number;
  annualInssWithheld: number;
  dependantCount: number;
  annualDependantDeduction: number;
}

export interface GenerateDirfReportResponse {
  year: number;
  generatedAt: string;
  companyInfo: {
    tenantId: string;
  };
  totalEmployees: number;
  totalIrrfWithheld: number;
  totalGrossIncome: number;
  employees: DirfEmployeeRecord[];
}

/** IRRF deduction per dependant per month (2024 value — R$ 189.59) */
const IRRF_DEPENDANT_MONTHLY_DEDUCTION = 189.59;

export class GenerateDirfReportUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private dependantsRepository: DependantsRepository,
  ) {}

  async execute(
    request: GenerateDirfReportRequest,
  ): Promise<GenerateDirfReportResponse> {
    const { tenantId, year } = request;

    const allEmployees = await this.employeesRepository.findMany(tenantId);

    // Filter employees who were active at any point during the year
    const employeesInYear = allEmployees.filter((emp) => {
      const hireYear = emp.hireDate.getFullYear();
      const terminationYear = emp.terminationDate
        ? emp.terminationDate.getFullYear()
        : null;

      return hireYear <= year && (!terminationYear || terminationYear >= year);
    });

    const yearPayrolls = await this.payrollsRepository.findManyByYear(
      year,
      tenantId,
    );

    // Build payroll data per employee per month
    const employeeMonthlyPayroll = new Map<
      string,
      Map<
        number,
        { grossIncome: number; irrfWithheld: number; inssWithheld: number }
      >
    >();

    for (const payroll of yearPayrolls) {
      const items = await this.payrollItemsRepository.findManyByPayroll(
        payroll.id,
      );

      for (const item of items) {
        const empId = item.employeeId.toString();

        if (!employeeMonthlyPayroll.has(empId)) {
          employeeMonthlyPayroll.set(empId, new Map());
        }

        const monthMap = employeeMonthlyPayroll.get(empId)!;
        if (!monthMap.has(payroll.referenceMonth)) {
          monthMap.set(payroll.referenceMonth, {
            grossIncome: 0,
            irrfWithheld: 0,
            inssWithheld: 0,
          });
        }

        const monthData = monthMap.get(payroll.referenceMonth)!;
        const itemType = item.type.value;

        if (itemType === 'IRRF' && item.isDeduction) {
          monthData.irrfWithheld += item.amount;
        } else if (itemType === 'INSS' && item.isDeduction) {
          monthData.inssWithheld += item.amount;
        } else if (!item.isDeduction) {
          monthData.grossIncome += item.amount;
        }
      }
    }

    let totalIrrfWithheld = 0;
    let totalGrossIncome = 0;

    const employeeRecords: DirfEmployeeRecord[] = [];

    for (const emp of employeesInYear) {
      const empId = emp.id.toString();
      const monthMap = employeeMonthlyPayroll.get(empId) ?? new Map();

      // Fetch dependants marked as IRRF dependants
      const dependants = await this.dependantsRepository.findByEmployeeId(
        emp.id,
        tenantId,
      );
      const irrfDependants = dependants.filter((dep) => dep.isIrrfDependant);
      const dependantCount = irrfDependants.length;

      const monthlyIncome: {
        month: number;
        grossIncome: number;
        irrfWithheld: number;
      }[] = [];

      let annualGrossIncome = 0;
      let annualIrrfWithheld = 0;
      let annualInssWithheld = 0;

      for (let month = 1; month <= 12; month++) {
        const monthData = monthMap.get(month);
        const grossIncome = monthData?.grossIncome ?? 0;
        const irrfWithheld = monthData?.irrfWithheld ?? 0;
        const inssWithheld = monthData?.inssWithheld ?? 0;

        monthlyIncome.push({ month, grossIncome, irrfWithheld });
        annualGrossIncome += grossIncome;
        annualIrrfWithheld += irrfWithheld;
        annualInssWithheld += inssWithheld;
      }

      // Count months worked to calculate dependant deduction
      const monthsWorked = monthlyIncome.filter(
        (m) => m.grossIncome > 0,
      ).length;
      const annualDependantDeduction =
        dependantCount * monthsWorked * IRRF_DEPENDANT_MONTHLY_DEDUCTION;

      totalIrrfWithheld += annualIrrfWithheld;
      totalGrossIncome += annualGrossIncome;

      employeeRecords.push({
        registrationNumber: emp.registrationNumber,
        fullName: emp.fullName,
        cpf: emp.cpf.value,
        monthlyIncome,
        annualGrossIncome,
        annualIrrfWithheld,
        annualInssWithheld,
        dependantCount,
        annualDependantDeduction,
      });
    }

    employeeRecords.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'pt-BR'),
    );

    return {
      year,
      generatedAt: new Date().toISOString(),
      companyInfo: { tenantId },
      totalEmployees: employeeRecords.length,
      totalIrrfWithheld,
      totalGrossIncome,
      employees: employeeRecords,
    };
  }
}
