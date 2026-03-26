import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { TimeEntry } from '@/entities/hr/time-entry';
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
  formatMinutesToHHMM,
  formatMonthYear,
  maskCPF,
} from '@/lib/pdf';
import type { TableColumn } from '@/lib/pdf';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export interface GenerateTimesheetPDFRequest {
  tenantId: string;
  employeeId: string;
  month: number; // 1-12
  year: number;
  companyName?: string;
  companyCnpj?: string;
  dailyExpectedMinutes?: number; // default 480 (8h)
}

export interface GenerateTimesheetPDFResponse {
  buffer: Buffer;
  filename: string;
}

interface DayRecord {
  day: number;
  date: Date;
  entries: TimeEntry[];
  clockIn1?: string;
  clockOut1?: string;
  clockIn2?: string;
  clockOut2?: string;
  workedMinutes: number;
  extraMinutes: number;
  isWeekend: boolean;
}

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export class GenerateTimesheetPDFUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: GenerateTimesheetPDFRequest,
  ): Promise<GenerateTimesheetPDFResponse> {
    const {
      tenantId,
      employeeId,
      month,
      year,
      companyName,
      companyCnpj,
      dailyExpectedMinutes = 480,
    } = request;

    // 1) Load employee
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // 2) Load time entries for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const timeEntries =
      await this.timeEntriesRepository.findManyByEmployeeAndDateRange(
        new UniqueEntityID(employeeId),
        startDate,
        endDate,
        tenantId,
      );

    // 3) Process entries into daily records
    const dayRecords = this.buildDayRecords(
      year,
      month,
      timeEntries,
      dailyExpectedMinutes,
    );

    // 4) Build PDF
    const buffer = await this.buildPDF(
      employee,
      dayRecords,
      month,
      year,
      dailyExpectedMinutes,
      companyName,
      companyCnpj,
    );

    const period = formatMonthYear(month, year);
    const filename = `espelho_ponto_${employee.registrationNumber}_${period.replace('/', '-')}.pdf`;

    return { buffer, filename };
  }

  private buildDayRecords(
    year: number,
    month: number,
    timeEntries: TimeEntry[],
    dailyExpectedMinutes: number,
  ): DayRecord[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const records: DayRecord[] = [];

    // Group entries by day
    const entriesByDay = new Map<number, TimeEntry[]>();
    for (const entry of timeEntries) {
      const day = entry.timestamp.getDate();
      if (!entriesByDay.has(day)) {
        entriesByDay.set(day, []);
      }
      entriesByDay.get(day)!.push(entry);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayEntries = (entriesByDay.get(day) ?? []).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );

      const record: DayRecord = {
        day,
        date,
        entries: dayEntries,
        workedMinutes: 0,
        extraMinutes: 0,
        isWeekend,
      };

      if (dayEntries.length > 0) {
        // Extract clock-in/out pairs
        const clockIns = dayEntries.filter((e) => e.isClockIn());
        const clockOuts = dayEntries.filter((e) => e.isClockOut());
        const breakStarts = dayEntries.filter((e) => e.isBreakStart());
        const breakEnds = dayEntries.filter((e) => e.isBreakEnd());

        // First period (before break)
        if (clockIns[0]) {
          record.clockIn1 = this.formatTime(clockIns[0].timestamp);
        }
        if (breakStarts[0]) {
          record.clockOut1 = this.formatTime(breakStarts[0].timestamp);
        } else if (clockOuts[0] && !clockIns[1]) {
          // No break — just a clock out
          record.clockOut1 = this.formatTime(clockOuts[0].timestamp);
        }

        // Second period (after break)
        if (breakEnds[0]) {
          record.clockIn2 = this.formatTime(breakEnds[0].timestamp);
        }
        if (clockOuts.length > 0) {
          const lastClockOut = clockOuts[clockOuts.length - 1];
          // Only set clockOut2 if there was a break (second period)
          if (breakStarts[0] || breakEnds[0]) {
            record.clockOut2 = this.formatTime(lastClockOut.timestamp);
          }
        }

        // Calculate worked minutes
        record.workedMinutes = this.calculateWorkedMinutes(dayEntries);

        // Calculate extra minutes
        if (!isWeekend && record.workedMinutes > dailyExpectedMinutes) {
          record.extraMinutes = record.workedMinutes - dailyExpectedMinutes;
        } else if (isWeekend && record.workedMinutes > 0) {
          // All weekend hours are extras
          record.extraMinutes = record.workedMinutes;
        }
      }

      records.push(record);
    }

    return records;
  }

  private calculateWorkedMinutes(entries: TimeEntry[]): number {
    let totalMinutes = 0;
    let clockInTime: Date | null = null;
    let breakStartTime: Date | null = null;
    let breakMinutes = 0;

    const sorted = [...entries].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    for (const entry of sorted) {
      const type = entry.entryType.value;

      switch (type) {
        case 'CLOCK_IN':
          clockInTime = entry.timestamp;
          break;
        case 'CLOCK_OUT':
          if (clockInTime) {
            totalMinutes += this.getMinutesDiff(clockInTime, entry.timestamp);
            clockInTime = null;
          }
          break;
        case 'BREAK_START':
          breakStartTime = entry.timestamp;
          break;
        case 'BREAK_END':
          if (breakStartTime) {
            breakMinutes += this.getMinutesDiff(
              breakStartTime,
              entry.timestamp,
            );
            breakStartTime = null;
          }
          break;
      }
    }

    return Math.max(0, totalMinutes - breakMinutes);
  }

  private getMinutesDiff(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private async buildPDF(
    employee: Employee,
    dayRecords: DayRecord[],
    month: number,
    year: number,
    dailyExpectedMinutes: number,
    companyName?: string,
    companyCnpj?: string,
  ): Promise<Buffer> {
    const period = formatMonthYear(month, year);
    const doc = createPDFDocument({
      title: `Espelho de Ponto - ${period}`,
      subject: `Espelho de Ponto de ${employee.fullName}`,
    });

    const margins = doc.page.margins;
    const contentWidth = doc.page.width - margins.left - margins.right;
    let y = margins.top;

    // ─── Header ───
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(
        `ESPELHO DE PONTO — ${this.getMonthName(month)}/${year}`,
        margins.left,
        y,
        {
          width: contentWidth,
          align: 'center',
        },
      );
    y += 18;

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1 });
    y += 8;

    // Company info
    doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');
    if (companyName) {
      doc.text(`Empresa: ${companyName}`, margins.left, y, {
        width: contentWidth / 2,
      });
    }
    if (companyCnpj) {
      doc.text(
        `CNPJ: ${formatCNPJ(companyCnpj)}`,
        margins.left + contentWidth / 2,
        y,
        { width: contentWidth / 2 },
      );
    }
    if (companyName || companyCnpj) y += 14;

    // Employee info
    doc.text(`Funcionário: ${employee.fullName}`, margins.left, y, {
      width: contentWidth / 2,
    });
    doc.text(
      `CPF: ${maskCPF(employee.cpf.formatted)}`,
      margins.left + contentWidth / 2,
      y,
      { width: contentWidth / 2 },
    );
    y += 14;

    doc.text(`Matrícula: ${employee.registrationNumber}`, margins.left, y, {
      width: contentWidth / 2,
    });
    doc.text(
      `Jornada Diária: ${formatMinutesToHHMM(dailyExpectedMinutes)}`,
      margins.left + contentWidth / 2,
      y,
      { width: contentWidth / 2 },
    );
    y += 16;

    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 6;

    // ─── Table ───
    const cols: TableColumn[] = [
      { header: 'Dia', width: 30, align: 'center' },
      { header: 'Sem', width: 30, align: 'center' },
      { header: 'Entrada', width: 55, align: 'center' },
      { header: 'Saída Int.', width: 55, align: 'center' },
      { header: 'Retorno', width: 55, align: 'center' },
      { header: 'Saída', width: 55, align: 'center' },
      { header: 'Trabalhado', width: 65, align: 'center' },
      { header: 'Extra', width: 55, align: 'center' },
      { header: 'Obs.', width: contentWidth - 400, align: 'left' },
    ];

    y = drawTableHeader(doc, cols, y);

    let totalWorkedMinutes = 0;
    let totalExtraMinutes = 0;
    let totalAbsences = 0;

    for (const record of dayRecords) {
      // Check page break
      if (y > doc.page.height - margins.bottom - 60) {
        doc.addPage();
        y = margins.top;
        y = drawTableHeader(doc, cols, y);
      }

      const weekdayName = WEEKDAY_NAMES[record.date.getDay()];
      let obs = '';

      if (record.isWeekend && record.entries.length === 0) {
        obs = record.date.getDay() === 0 ? 'DOM' : 'SÁB';
      } else if (!record.isWeekend && record.entries.length === 0) {
        obs = 'FALTA';
        totalAbsences++;
      }

      totalWorkedMinutes += record.workedMinutes;
      totalExtraMinutes += record.extraMinutes;

      const workedStr =
        record.workedMinutes > 0
          ? formatMinutesToHHMM(record.workedMinutes)
          : '—';
      const extraStr =
        record.extraMinutes > 0
          ? formatMinutesToHHMM(record.extraMinutes)
          : '—';

      y = drawTableRow(
        doc,
        cols,
        [
          String(record.day).padStart(2, '0'),
          weekdayName,
          record.clockIn1 || '—',
          record.clockOut1 || '—',
          record.clockIn2 || '—',
          record.clockOut2 || '—',
          workedStr,
          extraStr,
          obs,
        ],
        y,
        { fontSize: 7.5 },
      );

      // Light border between rows
      drawHorizontalLine(doc, y, { color: '#e2e8f0', lineWidth: 0.2 });
    }

    // ─── Totals ───
    y += 6;
    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1 });
    y += 8;

    const bankMinutes = totalExtraMinutes;
    const expectedTotalMinutes =
      dailyExpectedMinutes * dayRecords.filter((r) => !r.isWeekend).length;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b');

    doc.text(
      `TOTAL HORAS TRABALHADAS: ${formatMinutesToHHMM(totalWorkedMinutes)}`,
      margins.left,
      y,
      { width: contentWidth / 2 },
    );
    doc.text(
      `TOTAL HORAS EXTRAS: ${formatMinutesToHHMM(totalExtraMinutes)}`,
      margins.left + contentWidth / 2,
      y,
      { width: contentWidth / 2 },
    );
    y += 16;

    doc.text(`TOTAL FALTAS: ${totalAbsences} dia(s)`, margins.left, y, {
      width: contentWidth / 2,
    });
    doc.text(
      `BANCO DE HORAS: ${bankMinutes >= 0 ? '+' : ''}${formatMinutesToHHMM(bankMinutes)}`,
      margins.left + contentWidth / 2,
      y,
      { width: contentWidth / 2 },
    );
    y += 16;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        `Jornada prevista no mês: ${formatMinutesToHHMM(expectedTotalMinutes)}`,
        margins.left,
        y,
        { width: contentWidth },
      );
    y += 24;

    // ─── Signature lines ───
    if (y > doc.page.height - margins.bottom - 60) {
      doc.addPage();
      y = margins.top + 30;
    }

    const halfWidth = contentWidth / 2;

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 0.5 });
    y += 4;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text('Assinatura do Empregador', margins.left, y, {
        width: halfWidth - 20,
        align: 'center',
      });
    doc.text('Assinatura do Empregado', margins.left + halfWidth + 20, y, {
      width: halfWidth - 20,
      align: 'center',
    });
    y += 18;

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        `Documento gerado em ${formatDateBR(new Date())} — Portaria MTP nº 671/2021`,
        margins.left,
        y,
        { width: contentWidth, align: 'center' },
      );

    return collectPDFBuffer(doc);
  }

  private getMonthName(month: number): string {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return months[month - 1] || '';
  }
}
