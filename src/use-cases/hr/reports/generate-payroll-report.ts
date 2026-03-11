import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface GeneratePayrollReportRequest {
  tenantId: string;
  referenceMonth: number;
  referenceYear: number;
}

export interface GeneratePayrollReportResponse {
  csv: string;
  fileName: string;
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  BASE_SALARY: 'Salário Base',
  OVERTIME: 'Horas Extras',
  NIGHT_SHIFT: 'Adicional Noturno',
  HAZARD_PAY: 'Insalubridade',
  DANGER_PAY: 'Periculosidade',
  BONUS: 'Bônus',
  COMMISSION: 'Comissão',
  VACATION_PAY: 'Férias',
  THIRTEENTH_SALARY: '13º Salário',
  OTHER_BENEFIT: 'Outros Benefícios',
  INSS: 'INSS',
  IRRF: 'IRRF',
  FGTS: 'FGTS',
  HEALTH_PLAN: 'Plano de Saúde',
  DENTAL_PLAN: 'Plano Odontológico',
  TRANSPORT_VOUCHER: 'Vale Transporte',
  MEAL_VOUCHER: 'Vale Refeição',
  ADVANCE: 'Adiantamento',
  LOAN: 'Empréstimo',
  OTHER_DEDUCTION: 'Outras Deduções',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export class GeneratePayrollReportUseCase {
  constructor(
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: GeneratePayrollReportRequest,
  ): Promise<GeneratePayrollReportResponse> {
    const { tenantId, referenceMonth, referenceYear } = request;

    const payroll = await this.payrollsRepository.findByPeriod(
      referenceMonth,
      referenceYear,
      tenantId,
    );

    if (!payroll) {
      return {
        csv:
          '\uFEFF' +
          `Nenhuma folha de pagamento encontrada para ${String(referenceMonth).padStart(2, '0')}/${referenceYear}`,
        fileName: `folha_${String(referenceMonth).padStart(2, '0')}_${referenceYear}.csv`,
      };
    }

    const items = await this.payrollItemsRepository.findManyByPayroll(
      payroll.id,
    );

    // Group items by employee
    const employeeItemsMap = new Map<
      string,
      { earnings: Map<string, number>; deductions: Map<string, number> }
    >();

    for (const item of items) {
      const empId = item.employeeId.toString();
      if (!employeeItemsMap.has(empId)) {
        employeeItemsMap.set(empId, {
          earnings: new Map(),
          deductions: new Map(),
        });
      }

      const group = employeeItemsMap.get(empId)!;
      const typeKey = item.type.value;

      if (item.isDeduction) {
        const current = group.deductions.get(typeKey) ?? 0;
        group.deductions.set(typeKey, current + item.amount);
      } else {
        const current = group.earnings.get(typeKey) ?? 0;
        group.earnings.set(typeKey, current + item.amount);
      }
    }

    // Resolve employee names
    const employeeNames = new Map<string, string>();
    for (const empId of employeeItemsMap.keys()) {
      const employee = await this.employeesRepository.findById(
        new UniqueEntityID(empId),
        tenantId,
      );
      employeeNames.set(empId, employee?.fullName ?? empId);
    }

    const headers = [
      'Funcionário',
      'Salário Base',
      'Horas Extras',
      'Outros Proventos',
      'Total Proventos',
      'INSS',
      'IRRF',
      'FGTS',
      'Outros Descontos',
      'Total Descontos',
      'Líquido',
    ];

    const rows: string[][] = [];
    let grandTotalGross = 0;
    let grandTotalDeductions = 0;

    for (const [empId, group] of employeeItemsMap) {
      const baseSalary = group.earnings.get('BASE_SALARY') ?? 0;
      const overtime = group.earnings.get('OVERTIME') ?? 0;

      let otherEarnings = 0;
      for (const [type, amount] of group.earnings) {
        if (type !== 'BASE_SALARY' && type !== 'OVERTIME') {
          otherEarnings += amount;
        }
      }

      const totalGross = baseSalary + overtime + otherEarnings;

      const inss = group.deductions.get('INSS') ?? 0;
      const irrf = group.deductions.get('IRRF') ?? 0;
      const fgts = group.deductions.get('FGTS') ?? 0;

      let otherDeductions = 0;
      for (const [type, amount] of group.deductions) {
        if (type !== 'INSS' && type !== 'IRRF' && type !== 'FGTS') {
          otherDeductions += amount;
        }
      }

      const totalDeductions = inss + irrf + fgts + otherDeductions;
      const net = totalGross - totalDeductions;

      grandTotalGross += totalGross;
      grandTotalDeductions += totalDeductions;

      rows.push([
        employeeNames.get(empId) ?? empId,
        formatCurrency(baseSalary),
        formatCurrency(overtime),
        formatCurrency(otherEarnings),
        formatCurrency(totalGross),
        formatCurrency(inss),
        formatCurrency(irrf),
        formatCurrency(fgts),
        formatCurrency(otherDeductions),
        formatCurrency(totalDeductions),
        formatCurrency(net),
      ]);
    }

    // Sort by employee name
    rows.sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));

    // Summary row
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      formatCurrency(grandTotalGross),
      '',
      '',
      '',
      '',
      formatCurrency(grandTotalDeductions),
      formatCurrency(grandTotalGross - grandTotalDeductions),
    ]);

    const csvLines = [
      headers.join(';'),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
      ),
    ];

    const period = `${String(referenceMonth).padStart(2, '0')}_${referenceYear}`;
    return {
      csv: '\uFEFF' + csvLines.join('\r\n'),
      fileName: `folha_pagamento_${period}.csv`,
    };
  }
}
