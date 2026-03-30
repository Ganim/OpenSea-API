import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface GenerateSefipReportRequest {
  tenantId: string;
  year: number;
  month: number;
}

export interface SefipEmployeeRecord {
  registrationNumber: string;
  fullName: string;
  cpf: string;
  pis: string;
  hireDate: string;
  contractType: string;
  grossSalary: number;
  fgtsBase: number;
  fgtsAmount: number;
  inssBase: number;
  inssAmount: number;
  irrfAmount: number;
}

export interface GenerateSefipReportResponse {
  year: number;
  month: number;
  generatedAt: string;
  companyInfo: {
    tenantId: string;
  };
  totalEmployees: number;
  totalFgtsBase: number;
  totalFgtsAmount: number;
  totalInssBase: number;
  totalInssAmount: number;
  employees: SefipEmployeeRecord[];
}

/** FGTS rate: 8% of gross salary */
const FGTS_RATE = 0.08;

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export class GenerateSefipReportUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
  ) {}

  async execute(
    request: GenerateSefipReportRequest,
  ): Promise<GenerateSefipReportResponse> {
    const { tenantId, year, month } = request;

    const payroll = await this.payrollsRepository.findByPeriod(
      month,
      year,
      tenantId,
    );

    if (!payroll) {
      return {
        year,
        month,
        generatedAt: new Date().toISOString(),
        companyInfo: { tenantId },
        totalEmployees: 0,
        totalFgtsBase: 0,
        totalFgtsAmount: 0,
        totalInssBase: 0,
        totalInssAmount: 0,
        employees: [],
      };
    }

    const payrollItems = await this.payrollItemsRepository.findManyByPayroll(
      payroll.id,
    );

    // Group items by employee
    const employeeItemsMap = new Map<
      string,
      {
        grossSalary: number;
        fgtsAmount: number;
        inssAmount: number;
        irrfAmount: number;
      }
    >();

    for (const item of payrollItems) {
      const empId = item.employeeId.toString();

      if (!employeeItemsMap.has(empId)) {
        employeeItemsMap.set(empId, {
          grossSalary: 0,
          fgtsAmount: 0,
          inssAmount: 0,
          irrfAmount: 0,
        });
      }

      const empData = employeeItemsMap.get(empId)!;
      const itemType = item.type.value;

      if (itemType === 'FGTS' && item.isDeduction) {
        empData.fgtsAmount += item.amount;
      } else if (itemType === 'INSS' && item.isDeduction) {
        empData.inssAmount += item.amount;
      } else if (itemType === 'IRRF' && item.isDeduction) {
        empData.irrfAmount += item.amount;
      } else if (!item.isDeduction) {
        empData.grossSalary += item.amount;
      }
    }

    // Resolve employee data
    const allEmployees = await this.employeesRepository.findMany(tenantId);
    const employeesById = new Map(
      allEmployees.map((emp) => [emp.id.toString(), emp]),
    );

    let totalFgtsBase = 0;
    let totalFgtsAmount = 0;
    let totalInssBase = 0;
    let totalInssAmount = 0;

    const employeeRecords: SefipEmployeeRecord[] = [];

    for (const [empId, payrollData] of employeeItemsMap) {
      const emp = employeesById.get(empId);
      if (!emp) continue;

      const fgtsBase = payrollData.grossSalary;
      const calculatedFgts =
        payrollData.fgtsAmount > 0
          ? payrollData.fgtsAmount
          : fgtsBase * FGTS_RATE;
      const inssBase = payrollData.grossSalary;

      totalFgtsBase += fgtsBase;
      totalFgtsAmount += calculatedFgts;
      totalInssBase += inssBase;
      totalInssAmount += payrollData.inssAmount;

      employeeRecords.push({
        registrationNumber: emp.registrationNumber,
        fullName: emp.fullName,
        cpf: emp.cpf.value,
        pis: emp.pis?.value ?? '',
        hireDate: formatDate(emp.hireDate),
        contractType: emp.contractType.value,
        grossSalary: payrollData.grossSalary,
        fgtsBase,
        fgtsAmount: calculatedFgts,
        inssBase,
        inssAmount: payrollData.inssAmount,
        irrfAmount: payrollData.irrfAmount,
      });
    }

    employeeRecords.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'pt-BR'),
    );

    return {
      year,
      month,
      generatedAt: new Date().toISOString(),
      companyInfo: { tenantId },
      totalEmployees: employeeRecords.length,
      totalFgtsBase,
      totalFgtsAmount,
      totalInssBase,
      totalInssAmount,
      employees: employeeRecords,
    };
  }
}
