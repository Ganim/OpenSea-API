import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';
import type { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface GenerateRaisReportRequest {
  tenantId: string;
  year: number;
}

export interface RaisEmployeeRecord {
  registrationNumber: string;
  fullName: string;
  cpf: string;
  pis: string;
  birthDate: string;
  gender: string;
  hireDate: string;
  terminationDate: string;
  terminationType: string;
  contractType: string;
  workRegime: string;
  weeklyHours: number;
  baseSalary: number;
  monthlyEarnings: { month: number; grossAmount: number }[];
  annualGrossTotal: number;
  annualDeductionsTotal: number;
  annualNetTotal: number;
}

export interface GenerateRaisReportResponse {
  year: number;
  generatedAt: string;
  companyInfo: {
    tenantId: string;
  };
  totalEmployees: number;
  totalActiveEmployees: number;
  totalTerminatedEmployees: number;
  employees: RaisEmployeeRecord[];
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export class GenerateRaisReportUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private terminationsRepository: TerminationsRepository,
  ) {}

  async execute(
    request: GenerateRaisReportRequest,
  ): Promise<GenerateRaisReportResponse> {
    const { tenantId, year } = request;

    // Fetch all employees (active and terminated during the year)
    const allEmployees = await this.employeesRepository.findMany(tenantId);

    // Filter employees who were active at any point during the year
    const employeesInYear = allEmployees.filter((emp) => {
      const hireYear = emp.hireDate.getFullYear();
      const terminationYear = emp.terminationDate
        ? emp.terminationDate.getFullYear()
        : null;

      // Hired before or during the year
      const hiredBeforeYearEnd = hireYear <= year;

      // Not terminated before the year started
      const notTerminatedBeforeYear =
        !terminationYear || terminationYear >= year;

      return hiredBeforeYearEnd && notTerminatedBeforeYear;
    });

    // Fetch all payrolls for the year
    const yearPayrolls = await this.payrollsRepository.findManyByYear(
      year,
      tenantId,
    );

    // Fetch terminations for the year
    const allTerminations = await this.terminationsRepository.findMany(
      tenantId,
      {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31),
      },
    );

    const terminationsByEmployeeId = new Map(
      allTerminations.map((t) => [t.employeeId.toString(), t]),
    );

    // Build payroll items map: employeeId -> month -> { gross, deductions }
    const employeeMonthlyPayroll = new Map<
      string,
      Map<number, { grossAmount: number; deductionsAmount: number }>
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
            grossAmount: 0,
            deductionsAmount: 0,
          });
        }

        const monthData = monthMap.get(payroll.referenceMonth)!;
        if (item.isDeduction) {
          monthData.deductionsAmount += item.amount;
        } else {
          monthData.grossAmount += item.amount;
        }
      }
    }

    let activeCount = 0;
    let terminatedCount = 0;

    const employeeRecords: RaisEmployeeRecord[] = employeesInYear.map((emp) => {
      const empId = emp.id.toString();
      const termination = terminationsByEmployeeId.get(empId);
      const isTerminatedInYear =
        termination && termination.terminationDate.getFullYear() === year;

      if (isTerminatedInYear) {
        terminatedCount++;
      } else {
        activeCount++;
      }

      const monthMap = employeeMonthlyPayroll.get(empId) ?? new Map();
      const monthlyEarnings: { month: number; grossAmount: number }[] = [];
      let annualGrossTotal = 0;
      let annualDeductionsTotal = 0;

      for (let month = 1; month <= 12; month++) {
        const monthData = monthMap.get(month);
        const grossAmount = monthData?.grossAmount ?? 0;
        const deductionsAmount = monthData?.deductionsAmount ?? 0;

        monthlyEarnings.push({ month, grossAmount });
        annualGrossTotal += grossAmount;
        annualDeductionsTotal += deductionsAmount;
      }

      return {
        registrationNumber: emp.registrationNumber,
        fullName: emp.fullName,
        cpf: emp.cpf.value,
        pis: emp.pis?.value ?? '',
        birthDate: formatDate(emp.birthDate),
        gender: emp.gender ?? '',
        hireDate: formatDate(emp.hireDate),
        terminationDate: isTerminatedInYear
          ? formatDate(termination!.terminationDate)
          : '',
        terminationType: isTerminatedInYear ? termination!.type : '',
        contractType: emp.contractType.value,
        workRegime: emp.workRegime.value,
        weeklyHours: emp.weeklyHours,
        baseSalary: emp.baseSalary ?? 0,
        monthlyEarnings,
        annualGrossTotal,
        annualDeductionsTotal,
        annualNetTotal: annualGrossTotal - annualDeductionsTotal,
      };
    });

    // Sort by name for consistent output
    employeeRecords.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'pt-BR'),
    );

    return {
      year,
      generatedAt: new Date().toISOString(),
      companyInfo: { tenantId },
      totalEmployees: employeeRecords.length,
      totalActiveEmployees: activeCount,
      totalTerminatedEmployees: terminatedCount,
      employees: employeeRecords,
    };
  }
}
