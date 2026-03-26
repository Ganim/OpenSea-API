import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { TimeEntry } from '@/entities/hr/time-entry';
import {
  collectPDFBuffer,
  createPDFDocument,
  drawHorizontalLine,
  formatCNPJ,
  formatDateBR,
  maskCPF,
} from '@/lib/pdf';
import { prisma } from '@/lib/prisma';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export interface GeneratePunchReceiptPDFRequest {
  tenantId: string;
  timeEntryId: string;
  companyName?: string;
  companyCnpj?: string;
}

export interface GeneratePunchReceiptPDFResponse {
  buffer: Buffer;
  filename: string;
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  CLOCK_IN: 'Entrada',
  CLOCK_OUT: 'Saída',
  BREAK_START: 'Início de Intervalo',
  BREAK_END: 'Fim de Intervalo',
  OVERTIME_START: 'Início de Hora Extra',
  OVERTIME_END: 'Fim de Hora Extra',
};

export class GeneratePunchReceiptPDFUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: GeneratePunchReceiptPDFRequest,
  ): Promise<GeneratePunchReceiptPDFResponse> {
    const { tenantId, timeEntryId, companyName, companyCnpj } = request;

    // 1) Load time entry
    const timeEntry = await this.timeEntriesRepository.findById(
      new UniqueEntityID(timeEntryId),
      tenantId,
    );
    if (!timeEntry) {
      throw new ResourceNotFoundError('Registro de ponto não encontrado');
    }

    // 2) Load NSR from Prisma directly (not mapped to domain entity)
    const rawEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
      select: { nsrNumber: true },
    });
    const nsrNumber = rawEntry?.nsrNumber ?? null;

    // 3) Load employee
    const employee = await this.employeesRepository.findById(
      timeEntry.employeeId,
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // 4) Build PDF
    const buffer = await this.buildPDF(
      timeEntry,
      employee,
      nsrNumber,
      companyName,
      companyCnpj,
    );

    const dateStr = formatDateBR(timeEntry.timestamp).replace(/\//g, '-');
    const filename = `comprovante_ponto_${employee.registrationNumber}_${dateStr}.pdf`;

    return { buffer, filename };
  }

  private async buildPDF(
    timeEntry: TimeEntry,
    employee: Employee,
    nsrNumber: number | null,
    companyName?: string,
    companyCnpj?: string,
  ): Promise<Buffer> {
    // Punch receipt is a small document — half A4 height
    const doc = createPDFDocument({
      title: 'Comprovante de Registro de Ponto',
      subject: `Comprovante de ${employee.fullName}`,
    });

    const margins = doc.page.margins;
    const contentWidth = doc.page.width - margins.left - margins.right;
    let y = margins.top;

    // ─── Header ───
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1e293b')
      .text('COMPROVANTE DE REGISTRO DE PONTO', margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y += 16;
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#64748b')
      .text('Portaria MTP nº 671/2021', margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y += 14;

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1 });
    y += 10;

    // ─── Employer ───
    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

    if (companyName) {
      doc.text(`Empregador: ${companyName}`, margins.left, y, {
        width: contentWidth,
      });
      y += 14;
    }
    if (companyCnpj) {
      doc.text(`CNPJ: ${formatCNPJ(companyCnpj)}`, margins.left, y, {
        width: contentWidth,
      });
      y += 14;
    }

    y += 4;
    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 10;

    // ─── Employee ───
    doc.font('Helvetica-Bold').fontSize(8.5).text('EMPREGADO', margins.left, y);
    y += 14;

    doc.font('Helvetica').fontSize(8.5);
    doc.text(`Nome: ${employee.fullName}`, margins.left, y, {
      width: contentWidth,
    });
    y += 14;
    doc.text(`CPF: ${maskCPF(employee.cpf.formatted)}`, margins.left, y, {
      width: contentWidth / 2,
    });
    doc.text(
      `Matrícula: ${employee.registrationNumber}`,
      margins.left + contentWidth / 2,
      y,
      { width: contentWidth / 2 },
    );
    y += 18;

    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 10;

    // ─── Registration data ───
    doc.font('Helvetica-Bold').fontSize(8.5).text('REGISTRO', margins.left, y);
    y += 14;

    doc.font('Helvetica').fontSize(9);

    // Date/time
    const dateStr = formatDateBR(timeEntry.timestamp);
    const timeStr = timeEntry.timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#1e293b')
      .text(`${dateStr}  ${timeStr}`, margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y += 20;

    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

    // Entry type
    const entryTypeLabel =
      ENTRY_TYPE_LABELS[timeEntry.entryType.value] || timeEntry.entryType.value;
    doc.text(`Tipo: ${entryTypeLabel}`, margins.left, y, {
      width: contentWidth / 2,
    });

    // NSR
    if (nsrNumber) {
      doc.text(
        `NSR: ${String(nsrNumber).padStart(9, '0')}`,
        margins.left + contentWidth / 2,
        y,
        {
          width: contentWidth / 2,
        },
      );
    }
    y += 14;

    // Location
    if (timeEntry.hasLocation()) {
      doc.text(
        `Localização: ${timeEntry.latitude?.toFixed(6)}, ${timeEntry.longitude?.toFixed(6)}`,
        margins.left,
        y,
        { width: contentWidth },
      );
      y += 14;
    }

    // IP
    if (timeEntry.ipAddress) {
      doc.text(`IP: ${timeEntry.ipAddress}`, margins.left, y, {
        width: contentWidth,
      });
      y += 14;
    }

    y += 10;
    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1 });
    y += 10;

    // ─── Footer ───
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        'Este comprovante atende ao disposto na Portaria MTP nº 671/2021, Art. 79.',
        margins.left,
        y,
        { width: contentWidth, align: 'center' },
      );
    y += 10;
    doc.text(
      'O empregado deverá conferir e, se necessário, solicitar correção ao empregador.',
      margins.left,
      y,
      { width: contentWidth, align: 'center' },
    );

    return collectPDFBuffer(doc);
  }
}
