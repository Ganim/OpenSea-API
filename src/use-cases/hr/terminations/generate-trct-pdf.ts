import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import {
  type Termination,
  TerminationType,
  NoticeType,
} from '@/entities/hr/termination';
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
  maskCPF,
} from '@/lib/pdf';
import type { TableColumn } from '@/lib/pdf';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { TerminationsRepository } from '@/repositories/hr/terminations-repository';

export interface GenerateTRCTPDFRequest {
  tenantId: string;
  terminationId: string;
  companyName?: string;
  companyCnpj?: string;
  companyAddress?: string;
}

export interface GenerateTRCTPDFResponse {
  buffer: Buffer;
  filename: string;
}

const TERMINATION_TYPE_LABELS: Record<string, string> = {
  [TerminationType.SEM_JUSTA_CAUSA]: 'Dispensa Sem Justa Causa',
  [TerminationType.JUSTA_CAUSA]: 'Dispensa por Justa Causa',
  [TerminationType.PEDIDO_DEMISSAO]: 'Pedido de Demissão',
  [TerminationType.ACORDO_MUTUO]: 'Acordo Mútuo (Art. 484-A CLT)',
  [TerminationType.CONTRATO_TEMPORARIO]: 'Término de Contrato Temporário',
  [TerminationType.RESCISAO_INDIRETA]: 'Rescisão Indireta',
  [TerminationType.FALECIMENTO]: 'Falecimento do Empregado',
};

const NOTICE_TYPE_LABELS: Record<string, string> = {
  [NoticeType.TRABALHADO]: 'Trabalhado',
  [NoticeType.INDENIZADO]: 'Indenizado',
  [NoticeType.DISPENSADO]: 'Dispensado',
};

export class GenerateTRCTPDFUseCase {
  constructor(
    private terminationsRepository: TerminationsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: GenerateTRCTPDFRequest,
  ): Promise<GenerateTRCTPDFResponse> {
    const {
      tenantId,
      terminationId,
      companyName,
      companyCnpj,
      companyAddress,
    } = request;

    // 1) Load termination
    const termination = await this.terminationsRepository.findById(
      new UniqueEntityID(terminationId),
      tenantId,
    );
    if (!termination) {
      throw new ResourceNotFoundError('Rescisão não encontrada');
    }

    // 2) Load employee
    const employee = await this.employeesRepository.findById(
      termination.employeeId,
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // 3) Build PDF
    const buffer = await this.buildPDF(
      termination,
      employee,
      companyName,
      companyCnpj,
      companyAddress,
    );

    const filename = `trct_${employee.registrationNumber}_${formatDateBR(termination.terminationDate).replace(/\//g, '-')}.pdf`;

    return { buffer, filename };
  }

  private async buildPDF(
    termination: Termination,
    employee: Employee,
    companyName?: string,
    companyCnpj?: string,
    companyAddress?: string,
  ): Promise<Buffer> {
    const doc = createPDFDocument({
      title: 'Termo de Rescisão do Contrato de Trabalho',
      subject: `TRCT de ${employee.fullName}`,
    });

    const margins = doc.page.margins;
    const contentWidth = doc.page.width - margins.left - margins.right;
    let y = margins.top;

    // ─── Title ───
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1e293b')
      .text('TERMO DE RESCISÃO DO CONTRATO DE TRABALHO', margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y += 20;

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1 });
    y += 8;

    // ─── Section 1: Employer data ───
    y = drawSectionHeader(doc, '1. IDENTIFICAÇÃO DO EMPREGADOR', y);
    y += 4;

    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

    doc.text(`Razão Social: ${companyName || '—'}`, margins.left, y, {
      width: contentWidth,
    });
    y += 14;

    if (companyCnpj) {
      doc.text(`CNPJ: ${formatCNPJ(companyCnpj)}`, margins.left, y, {
        width: contentWidth / 2,
      });
    }
    if (companyAddress) {
      doc.text(
        `Endereço: ${companyAddress}`,
        margins.left + contentWidth / 2,
        y,
        { width: contentWidth / 2 },
      );
    }
    y += 18;

    // ─── Section 2: Employee data ───
    y = drawSectionHeader(doc, '2. IDENTIFICAÇÃO DO EMPREGADO', y);
    y += 4;

    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

    doc.text(`Nome: ${employee.fullName}`, margins.left, y, {
      width: contentWidth,
    });
    y += 14;

    const halfWidth = contentWidth / 2;

    doc.text(`CPF: ${maskCPF(employee.cpf.formatted)}`, margins.left, y, {
      width: halfWidth,
    });
    if (employee.pis) {
      doc.text(`PIS: ${employee.pis.value}`, margins.left + halfWidth, y, {
        width: halfWidth,
      });
    }
    y += 14;

    if (employee.ctpsNumber) {
      doc.text(
        `CTPS: ${employee.ctpsNumber}/${employee.ctpsSeries || '—'} — ${employee.ctpsState || '—'}`,
        margins.left,
        y,
        { width: halfWidth },
      );
    }
    doc.text(
      `Admissão: ${formatDateBR(employee.hireDate)}`,
      margins.left + halfWidth,
      y,
      { width: halfWidth },
    );
    y += 18;

    // ─── Section 3: Termination data ───
    y = drawSectionHeader(doc, '3. DADOS DA RESCISÃO', y);
    y += 4;

    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

    doc.text(
      `Tipo de Rescisão: ${TERMINATION_TYPE_LABELS[termination.type] || termination.type}`,
      margins.left,
      y,
      { width: contentWidth },
    );
    y += 14;

    doc.text(
      `Data de Demissão: ${formatDateBR(termination.terminationDate)}`,
      margins.left,
      y,
      { width: halfWidth },
    );
    doc.text(
      `Último Dia Trabalhado: ${formatDateBR(termination.lastWorkDay)}`,
      margins.left + halfWidth,
      y,
      { width: halfWidth },
    );
    y += 14;

    doc.text(
      `Aviso Prévio: ${NOTICE_TYPE_LABELS[termination.noticeType] || termination.noticeType} — ${termination.noticeDays} dias`,
      margins.left,
      y,
      { width: halfWidth },
    );
    doc.text(
      `Prazo de Pagamento: ${formatDateBR(termination.paymentDeadline)}`,
      margins.left + halfWidth,
      y,
      { width: halfWidth },
    );
    y += 18;

    // ─── Section 4: Verbas rescisórias ───
    y = drawSectionHeader(doc, '4. DISCRIMINAÇÃO DAS VERBAS RESCISÓRIAS', y);
    y += 4;

    const cols: TableColumn[] = [
      { header: 'Descrição', width: contentWidth - 100, align: 'left' },
      { header: 'Valor (R$)', width: 100, align: 'right' },
    ];

    y = drawTableHeader(doc, cols, y);

    // --- PROVENTOS ---
    y = drawSectionHeader(doc, 'PROVENTOS', y);

    interface VerbaLine {
      label: string;
      value: number | undefined;
    }

    const proventos: VerbaLine[] = [
      { label: 'Saldo de Salário', value: termination.saldoSalario },
      { label: 'Aviso Prévio Indenizado', value: termination.avisoIndenizado },
      {
        label: '13º Salário Proporcional',
        value: termination.decimoTerceiroProp,
      },
      { label: 'Férias Vencidas', value: termination.feriasVencidas },
      {
        label: '1/3 Férias Vencidas',
        value: termination.feriasVencidasTerco,
      },
      {
        label: 'Férias Proporcionais',
        value: termination.feriasProporcional,
      },
      {
        label: '1/3 Férias Proporcionais',
        value: termination.feriasProporcionalTerco,
      },
    ];

    let totalProventos = 0;
    for (const item of proventos) {
      if (item.value && item.value > 0) {
        totalProventos += item.value;
        y = drawTableRow(doc, cols, [item.label, formatBRL(item.value)], y);
        if (y > doc.page.height - margins.bottom - 100) {
          doc.addPage();
          y = margins.top;
        }
      }
    }

    // Multa FGTS (informativo — goes to FGTS account, not to employee directly, but listed as provento in TRCT)
    if (termination.multaFgts && termination.multaFgts > 0) {
      totalProventos += termination.multaFgts;
      y = drawTableRow(
        doc,
        cols,
        ['Multa FGTS (40% ou 20%)', formatBRL(termination.multaFgts)],
        y,
      );
    }

    y = drawTableRow(
      doc,
      cols,
      ['TOTAL PROVENTOS', formatBRL(totalProventos)],
      y,
      { bold: true, fontSize: 9 },
    );
    y += 4;

    // --- DESCONTOS ---
    y = drawSectionHeader(doc, 'DESCONTOS', y);

    const descontos: VerbaLine[] = [
      { label: 'INSS', value: termination.inssRescisao },
      { label: 'IRRF', value: termination.irrfRescisao },
      { label: 'Outros Descontos', value: termination.outrosDescontos },
    ];

    let totalDescontos = 0;
    for (const item of descontos) {
      if (item.value && item.value > 0) {
        totalDescontos += item.value;
        y = drawTableRow(doc, cols, [item.label, formatBRL(item.value)], y);
      }
    }

    y = drawTableRow(
      doc,
      cols,
      ['TOTAL DESCONTOS', formatBRL(totalDescontos)],
      y,
      { bold: true, fontSize: 9 },
    );

    // ─── Totals ───
    y += 6;
    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1.5 });
    y += 8;

    const totalLiquido =
      termination.totalLiquido ?? totalProventos - totalDescontos;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(
        `VALOR LÍQUIDO DA RESCISÃO: ${formatBRL(totalLiquido)}`,
        margins.left,
        y,
        {
          width: contentWidth,
          align: 'right',
        },
      );
    y += 24;

    // ─── Notes ───
    if (termination.notes) {
      y = drawSectionHeader(doc, '5. OBSERVAÇÕES', y);
      y += 4;
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(termination.notes, margins.left, y, {
          width: contentWidth,
        });
      y += 20;
    }

    // ─── Signature lines ───
    y += 30;
    if (y > doc.page.height - margins.bottom - 80) {
      doc.addPage();
      y = margins.top + 30;
    }

    const sigY = y;

    // Line 1 - Employer
    drawHorizontalLine(doc, sigY, { color: '#1e293b', lineWidth: 0.5 });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text('Assinatura do Empregador', margins.left, sigY + 4, {
        width: halfWidth - 20,
        align: 'center',
      });

    // Line 2 - Employee
    doc.text(
      'Assinatura do Empregado',
      margins.left + halfWidth + 20,
      sigY + 4,
      { width: halfWidth - 20, align: 'center' },
    );

    y = sigY + 30;

    // Date and place
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        `Local e Data: _________________________________, ${formatDateBR(new Date())}`,
        margins.left,
        y,
        { width: contentWidth },
      );
    y += 20;

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        `Documento gerado em ${formatDateBR(new Date())} — Conforme Portaria MTP nº 671/2021`,
        margins.left,
        y,
        { width: contentWidth, align: 'center' },
      );

    return collectPDFBuffer(doc);
  }
}
