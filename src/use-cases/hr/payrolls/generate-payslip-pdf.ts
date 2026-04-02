import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { Payroll } from '@/entities/hr/payroll';
import type { PayrollItem } from '@/entities/hr/payroll-item';
import {
  collectPDFBuffer,
  createPDFDocument,
  drawHorizontalLine,
  drawSectionHeader,
  drawTableHeader,
  drawTableRow,
  formatBRL,
  formatCNPJ,
  formatDateBR,
  formatMonthYear,
  maskCPF,
} from '@/lib/pdf';
import type { TableColumn } from '@/lib/pdf';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface GeneratePayslipPDFRequest {
  tenantId: string;
  payrollId: string;
  employeeId: string;
  companyName?: string;
  companyCnpj?: string;
}

export interface GeneratePayslipPDFResponse {
  buffer: Buffer;
  filename: string;
}

/**
 * Payroll item type labels in Portuguese
 */
const ITEM_TYPE_LABELS: Record<string, string> = {
  BASE_SALARY: 'Salário Base',
  OVERTIME: 'Horas Extras 50%',
  OVERTIME_100: 'Horas Extras 100%',
  NIGHT_SHIFT: 'Adicional Noturno',
  DSR: 'DSR s/ Horas Extras',
  HAZARD_PAY: 'Adicional de Insalubridade',
  DANGER_PAY: 'Adicional de Periculosidade',
  BONUS: 'Bonificação',
  COMMISSION: 'Comissão',
  VACATION_PAY: 'Férias',
  THIRTEENTH_SALARY: '13º Salário',
  INSS: 'INSS',
  IRRF: 'IRRF',
  FGTS: 'FGTS (Depósito)',
  HEALTH_PLAN: 'Plano de Saúde',
  DENTAL_PLAN: 'Plano Odontológico',
  TRANSPORT_VOUCHER: 'Vale-Transporte',
  MEAL_VOUCHER: 'Vale-Refeição',
  OTHER_BENEFIT: 'Outros Benefícios',
  ADVANCE: 'Adiantamento',
  LOAN: 'Empréstimo',
  OTHER_DEDUCTION: 'Outros Descontos',
};

export class GeneratePayslipPDFUseCase {
  constructor(
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: GeneratePayslipPDFRequest,
  ): Promise<GeneratePayslipPDFResponse> {
    const { tenantId, payrollId, employeeId, companyName, companyCnpj } =
      request;

    // 1) Load payroll
    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
      tenantId,
    );
    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    // 2) Load employee
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // 3) Load payroll items for this employee
    const items =
      await this.payrollItemsRepository.findManyByPayrollAndEmployee(
        new UniqueEntityID(payrollId),
        new UniqueEntityID(employeeId),
      );

    if (items.length === 0) {
      throw new ResourceNotFoundError(
        'Nenhum item de folha encontrado para este funcionário',
      );
    }

    // 4) Build PDF
    const buffer = await this.buildPDF(
      payroll,
      employee,
      items,
      companyName,
      companyCnpj,
    );

    const period = formatMonthYear(
      payroll.referenceMonth,
      payroll.referenceYear,
    );
    const filename = `holerite_${employee.registrationNumber}_${period.replace('/', '-')}.pdf`;

    return { buffer, filename };
  }

  private async buildPDF(
    payroll: Payroll,
    employee: Employee,
    items: PayrollItem[],
    companyName?: string,
    companyCnpj?: string,
  ): Promise<Buffer> {
    const period = formatMonthYear(
      payroll.referenceMonth,
      payroll.referenceYear,
    );

    const doc = createPDFDocument({
      title: `Recibo de Pagamento - ${period}`,
      subject: `Holerite de ${employee.fullName}`,
    });

    const margins = doc.page.margins;
    const contentWidth = doc.page.width - margins.left - margins.right;
    let y = margins.top;

    // ─── Header: Company ───
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#1e293b')
      .text(companyName || 'Empresa', margins.left, y, {
        width: contentWidth,
      });
    y += 16;

    if (companyCnpj) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#64748b')
        .text(`CNPJ: ${formatCNPJ(companyCnpj)}`, margins.left, y, {
          width: contentWidth,
        });
      y += 14;
    }

    y += 4;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1e293b')
      .text(
        `RECIBO DE PAGAMENTO DE SALÁRIO — Competência: ${period}`,
        margins.left,
        y,
        { width: contentWidth, align: 'center' },
      );
    y += 18;

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1 });
    y += 8;

    // ─── Employee info ───
    const cpfFormatted = maskCPF(employee.cpf.formatted);

    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

    doc.text(`Funcionário: `, margins.left, y, { continued: true });
    doc.font('Helvetica-Bold').text(employee.fullName);
    y += 14;

    doc.font('Helvetica').text(`CPF: ${cpfFormatted}`, margins.left, y, {
      width: contentWidth / 2,
    });
    doc.text(
      `Admissão: ${formatDateBR(employee.hireDate)}`,
      margins.left + contentWidth / 2,
      y,
      {
        width: contentWidth / 2,
      },
    );
    y += 14;

    doc.text(`Matrícula: ${employee.registrationNumber}`, margins.left, y, {
      width: contentWidth / 2,
    });
    if (employee.baseSalary) {
      doc.text(
        `Salário Base: ${formatBRL(employee.baseSalary)}`,
        margins.left + contentWidth / 2,
        y,
        { width: contentWidth / 2 },
      );
    }
    y += 18;

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 0.5 });
    y += 6;

    // ─── Table: Items ───
    const _columns: TableColumn[] = [
      { header: 'Código', width: 80, align: 'left' },
      { header: 'Descrição', width: contentWidth - 240, align: 'left' },
      { header: 'Ref.', width: 60, align: 'center' },
      { header: 'Proventos (R$)', width: 100, align: 'right' },
    ];

    // We'll use a 5-column layout: Código, Descrição, Ref, Proventos, Descontos
    const cols5: TableColumn[] = [
      { header: 'Código', width: 70, align: 'left' },
      { header: 'Descrição', width: contentWidth - 310, align: 'left' },
      { header: 'Ref.', width: 50, align: 'center' },
      { header: 'Proventos (R$)', width: 95, align: 'right' },
      { header: 'Descontos (R$)', width: 95, align: 'right' },
    ];

    y = drawTableHeader(doc, cols5, y);

    // Separate earnings and deductions
    const earnings = items.filter((item) => !item.isDeduction);
    const deductions = items.filter(
      (item) => item.isDeduction && item.type.value !== 'FGTS',
    );
    const fgtsItem = items.find((item) => item.type.value === 'FGTS');

    // Draw section: PROVENTOS
    y = drawSectionHeader(doc, 'PROVENTOS', y);

    let totalEarnings = 0;
    for (const item of earnings) {
      totalEarnings += item.amount;
      const label = ITEM_TYPE_LABELS[item.type.value] || item.description;
      y = drawTableRow(
        doc,
        cols5,
        [item.type.value, label, '', formatBRL(item.amount), ''],
        y,
      );

      // Check if we need a new page
      if (y > doc.page.height - margins.bottom - 100) {
        doc.addPage();
        y = margins.top;
      }
    }

    // Draw section: DESCONTOS
    y = drawSectionHeader(doc, 'DESCONTOS', y);

    let totalDeductions = 0;
    for (const item of deductions) {
      totalDeductions += item.amount;
      const label = ITEM_TYPE_LABELS[item.type.value] || item.description;
      y = drawTableRow(
        doc,
        cols5,
        [item.type.value, label, '', '', formatBRL(item.amount)],
        y,
      );

      if (y > doc.page.height - margins.bottom - 100) {
        doc.addPage();
        y = margins.top;
      }
    }

    // ─── Totals ───
    y += 4;
    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1 });
    y += 6;

    const totalNet = totalEarnings - totalDeductions;

    y = drawTableRow(
      doc,
      cols5,
      ['', 'TOTAL PROVENTOS', '', formatBRL(totalEarnings), ''],
      y,
      { bold: true, fontSize: 9 },
    );

    y = drawTableRow(
      doc,
      cols5,
      ['', 'TOTAL DESCONTOS', '', '', formatBRL(totalDeductions)],
      y,
      { bold: true, fontSize: 9 },
    );

    y += 4;
    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1.5 });
    y += 8;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(`VALOR LÍQUIDO: ${formatBRL(totalNet)}`, margins.left, y, {
        width: contentWidth,
        align: 'right',
      });
    y += 22;

    // ─── FGTS Informativo ───
    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 6;

    if (fgtsItem) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(
          `FGTS do mês: ${formatBRL(fgtsItem.amount)} (informativo — não descontado do salário)`,
          margins.left,
          y,
          { width: contentWidth },
        );
      y += 14;
    }

    // Base de cálculo
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        `Base INSS: ${formatBRL(totalEarnings)}    Base IRRF: ${formatBRL(totalEarnings - this.getItemAmount(deductions, 'INSS'))}`,
        margins.left,
        y,
        { width: contentWidth },
      );
    y += 20;

    // ─── Signature lines ───
    y += 30;
    if (y > doc.page.height - margins.bottom - 60) {
      doc.addPage();
      y = margins.top + 30;
    }

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 0.5 });
    y += 4;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text('Assinatura do Empregador', margins.left, y, {
        width: contentWidth / 2 - 20,
        align: 'center',
      });

    doc.text(
      'Assinatura do Empregado',
      margins.left + contentWidth / 2 + 20,
      y,
      { width: contentWidth / 2 - 20, align: 'center' },
    );
    y += 16;

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        `Documento gerado em ${formatDateBR(new Date())} — Art. 464 da CLT`,
        margins.left,
        y,
        { width: contentWidth, align: 'center' },
      );

    return collectPDFBuffer(doc);
  }

  private getItemAmount(items: PayrollItem[], typeValue: string): number {
    const item = items.find((i) => i.type.value === typeValue);
    return item?.amount ?? 0;
  }
}
