import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface GenerateCagedReportRequest {
  tenantId: string;
  year: number;
  month: number;
}

export interface CagedAdmissionRecord {
  registrationNumber: string;
  fullName: string;
  cpf: string;
  pis: string;
  birthDate: string;
  gender: string;
  hireDate: string;
  contractType: string;
  workRegime: string;
  weeklyHours: number;
  baseSalary: number;
}

export interface CagedTerminationRecord {
  registrationNumber: string;
  fullName: string;
  cpf: string;
  pis: string;
  terminationDate: string;
  terminationType: string;
  hireDate: string;
}

export interface GenerateCagedReportResponse {
  year: number;
  month: number;
  generatedAt: string;
  companyInfo: {
    tenantId: string;
  };
  totalAdmissions: number;
  totalTerminations: number;
  netBalance: number;
  admissions: CagedAdmissionRecord[];
  terminations: CagedTerminationRecord[];
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export class GenerateCagedReportUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private terminationsRepository: TerminationsRepository,
  ) {}

  async execute(
    request: GenerateCagedReportRequest,
  ): Promise<GenerateCagedReportResponse> {
    const { tenantId, year, month } = request;

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // Last day of the month

    // Fetch all employees to find admissions in the period
    const allEmployees = await this.employeesRepository.findMany(tenantId);

    const admittedInPeriod = allEmployees.filter((emp) => {
      const hireDate = emp.hireDate;
      return (
        hireDate.getFullYear() === year && hireDate.getMonth() + 1 === month
      );
    });

    // Fetch terminations in the period
    const terminationsInPeriod = await this.terminationsRepository.findMany(
      tenantId,
      {
        startDate: periodStart,
        endDate: periodEnd,
      },
    );

    // Build a map of employee IDs to employee data for terminated employees
    const employeesById = new Map(
      allEmployees.map((emp) => [emp.id.toString(), emp]),
    );

    const admissionRecords: CagedAdmissionRecord[] = admittedInPeriod.map(
      (emp) => ({
        registrationNumber: emp.registrationNumber,
        fullName: emp.fullName,
        cpf: emp.cpf.value,
        pis: emp.pis?.value ?? '',
        birthDate: formatDate(emp.birthDate),
        gender: emp.gender ?? '',
        hireDate: formatDate(emp.hireDate),
        contractType: emp.contractType.value,
        workRegime: emp.workRegime.value,
        weeklyHours: emp.weeklyHours,
        baseSalary: emp.baseSalary ?? 0,
      }),
    );

    const terminationRecords: CagedTerminationRecord[] = [];
    for (const termination of terminationsInPeriod) {
      const emp = employeesById.get(termination.employeeId.toString());
      if (!emp) continue;

      terminationRecords.push({
        registrationNumber: emp.registrationNumber,
        fullName: emp.fullName,
        cpf: emp.cpf.value,
        pis: emp.pis?.value ?? '',
        terminationDate: formatDate(termination.terminationDate),
        terminationType: termination.type,
        hireDate: formatDate(emp.hireDate),
      });
    }

    admissionRecords.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'pt-BR'),
    );
    terminationRecords.sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'pt-BR'),
    );

    return {
      year,
      month,
      generatedAt: new Date().toISOString(),
      companyInfo: { tenantId },
      totalAdmissions: admissionRecords.length,
      totalTerminations: terminationRecords.length,
      netBalance: admissionRecords.length - terminationRecords.length,
      admissions: admissionRecords,
      terminations: terminationRecords,
    };
  }
}
