import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

import { exportToPDF } from './export-pdf';
import { exportToXLSX } from './export-xlsx';
import { exportToDOCX } from './export-docx';

export type ExportFormat = 'CSV' | 'PDF' | 'XLSX' | 'DOCX';

interface ExportAccountingRequest {
  tenantId: string;
  format: ExportFormat;
  reportType: 'ENTRIES' | 'BALANCE' | 'DRE' | 'CASHFLOW';
  startDate: Date;
  endDate: Date;
  type?: string;
  costCenterId?: string;
  categoryId?: string;
}

export interface ExportAccountingResponse {
  fileName: string;
  data: Buffer;
  mimeType: string;
}

// UTF-8 BOM for Excel compatibility
const UTF8_BOM = '\ufeff';

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatMoney(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pendente',
    OVERDUE: 'Atrasado',
    PAID: 'Pago',
    RECEIVED: 'Recebido',
    PARTIALLY_PAID: 'Parcialmente Pago',
    CANCELLED: 'Cancelado',
    SCHEDULED: 'Agendado',
  };
  return map[status] ?? status;
}

function formatType(type: string): string {
  return type === 'PAYABLE' ? 'A Pagar' : 'A Receber';
}

function escapeCsvField(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const REPORT_TITLES: Record<string, string> = {
  ENTRIES: 'Lancamentos',
  DRE: 'Demonstracao do Resultado do Exercicio',
  BALANCE: 'Balancete',
  CASHFLOW: 'Fluxo de Caixa',
};

const FILE_PREFIXES: Record<string, string> = {
  ENTRIES: 'lancamentos',
  DRE: 'dre',
  BALANCE: 'balancete',
  CASHFLOW: 'fluxo_caixa',
};

const FORMAT_MIMES: Record<ExportFormat, string> = {
  CSV: 'text/csv; charset=utf-8',
  PDF: 'application/pdf',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  CSV: 'csv',
  PDF: 'pdf',
  XLSX: 'xlsx',
  DOCX: 'docx',
};

export class ExportAccountingDataUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: ExportAccountingRequest,
  ): Promise<ExportAccountingResponse> {
    const {
      tenantId,
      format,
      reportType,
      startDate,
      endDate,
      type,
      costCenterId,
      categoryId,
    } = request;

    // Extract data into headers + rows
    const { headers, rows } = await this.extractData(
      reportType,
      tenantId,
      startDate,
      endDate,
      type,
      costCenterId,
      categoryId,
    );

    const title = REPORT_TITLES[reportType] ?? reportType;
    const dateRange = `${formatDate(startDate).replace(/\//g, '-')}_${formatDate(endDate).replace(/\//g, '-')}`;
    const prefix = FILE_PREFIXES[reportType] ?? 'relatorio';

    // Render to format
    let data: Buffer;

    if (format === 'CSV') {
      const csv =
        UTF8_BOM +
        [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      data = Buffer.from(csv, 'utf-8');
    } else if (format === 'PDF') {
      data = await exportToPDF({
        reportType,
        startDate,
        endDate,
        headers,
        rows,
        title,
      });
    } else if (format === 'XLSX') {
      data = await exportToXLSX({
        reportType,
        startDate,
        endDate,
        headers,
        rows,
        title,
      });
    } else if (format === 'DOCX') {
      data = await exportToDOCX({
        reportType,
        startDate,
        endDate,
        headers,
        rows,
        title,
      });
    } else {
      throw new Error(`Formato de exportacao invalido: ${format}`);
    }

    return {
      fileName: `${prefix}_${dateRange}.${FORMAT_EXTENSIONS[format]}`,
      data,
      mimeType: FORMAT_MIMES[format],
    };
  }

  private async extractData(
    reportType: string,
    tenantId: string,
    startDate: Date,
    endDate: Date,
    type?: string,
    costCenterId?: string,
    categoryId?: string,
  ): Promise<{ headers: string[]; rows: string[][] }> {
    switch (reportType) {
      case 'ENTRIES':
        return this.extractEntries(
          tenantId,
          startDate,
          endDate,
          type,
          costCenterId,
          categoryId,
        );
      case 'DRE':
        return this.extractDRE(tenantId, startDate, endDate);
      case 'BALANCE':
        return this.extractBalance(tenantId, startDate, endDate);
      case 'CASHFLOW':
        return this.extractCashflow(tenantId, startDate, endDate);
      default:
        throw new Error(`Tipo de relatorio invalido: ${reportType}`);
    }
  }

  private async extractEntries(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    type?: string,
    costCenterId?: string,
    categoryId?: string,
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      type,
      costCenterId,
      categoryId,
      dueDateFrom: startDate,
      dueDateTo: endDate,
      limit: 10000,
    });

    const headers = [
      'Codigo',
      'Tipo',
      'Descricao',
      'Categoria',
      'Centro de Custo',
      'Valor Previsto',
      'Valor Pago',
      'Desconto',
      'Juros',
      'Multa',
      'Total Devido',
      'Vencimento',
      'Pagamento',
      'Status',
      'Fornecedor/Cliente',
      'Competencia',
    ];

    const rows = entries.map((e) => [
      escapeCsvField(e.code),
      formatType(e.type),
      escapeCsvField(e.description),
      e.categoryId.toString(),
      e.costCenterId?.toString() ?? '',
      formatMoney(e.expectedAmount),
      e.actualAmount !== undefined ? formatMoney(e.actualAmount) : '',
      formatMoney(e.discount),
      formatMoney(e.interest),
      formatMoney(e.penalty),
      formatMoney(e.totalDue),
      formatDate(e.dueDate),
      e.paymentDate ? formatDate(e.paymentDate) : '',
      formatStatus(e.status),
      escapeCsvField(e.supplierName ?? e.customerName ?? ''),
      e.competenceDate ? formatDate(e.competenceDate) : '',
    ]);

    return { headers, rows };
  }

  private async extractDRE(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const { entries: allEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        dueDateFrom: startDate,
        dueDateTo: endDate,
        limit: 10000,
      });

    const paidStatuses = ['PAID', 'RECEIVED', 'PARTIALLY_PAID'];

    const revenue = allEntries
      .filter((e) => e.type === 'RECEIVABLE' && paidStatuses.includes(e.status))
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

    const expenses = allEntries
      .filter((e) => e.type === 'PAYABLE' && paidStatuses.includes(e.status))
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

    const result = revenue - expenses;

    const headers = ['Descricao', 'Valor'];
    const rows = [
      ['RECEITAS', ''],
      ['  Receitas Operacionais', formatMoney(revenue)],
      ['', ''],
      ['(-) CUSTOS E DESPESAS', ''],
      ['  Despesas Operacionais', formatMoney(expenses)],
      ['', ''],
      ['(=) RESULTADO DO PERIODO', formatMoney(result)],
    ];

    return { headers, rows };
  }

  private async extractBalance(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const debits = await this.financeEntriesRepository.sumByCostCenter(
      tenantId,
      'PAYABLE',
      startDate,
      endDate,
    );

    const credits = await this.financeEntriesRepository.sumByCostCenter(
      tenantId,
      'RECEIVABLE',
      startDate,
      endDate,
    );

    const costCenterIds = new Set([
      ...debits.map((d) => d.costCenterId),
      ...credits.map((c) => c.costCenterId),
    ]);

    const headers = ['Centro de Custo', 'Debitos', 'Creditos', 'Saldo'];
    const rows: string[][] = [];

    let totalDebits = 0;
    let totalCredits = 0;

    for (const id of costCenterIds) {
      const debit = debits.find((d) => d.costCenterId === id);
      const credit = credits.find((c) => c.costCenterId === id);
      const debitValue = debit?.total ?? 0;
      const creditValue = credit?.total ?? 0;
      const name = debit?.costCenterName ?? credit?.costCenterName ?? id;

      totalDebits += debitValue;
      totalCredits += creditValue;

      rows.push([
        escapeCsvField(name),
        formatMoney(debitValue),
        formatMoney(creditValue),
        formatMoney(creditValue - debitValue),
      ]);
    }

    rows.push([]);
    rows.push([
      'TOTAL',
      formatMoney(totalDebits),
      formatMoney(totalCredits),
      formatMoney(totalCredits - totalDebits),
    ]);

    return { headers, rows };
  }

  private async extractCashflow(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const { entries: allEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        dueDateFrom: startDate,
        dueDateTo: endDate,
        limit: 10000,
      });

    const paidStatuses = ['PAID', 'RECEIVED', 'PARTIALLY_PAID'];

    const inflows = allEntries
      .filter((e) => e.type === 'RECEIVABLE' && paidStatuses.includes(e.status))
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

    const outflows = allEntries
      .filter((e) => e.type === 'PAYABLE' && paidStatuses.includes(e.status))
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

    const netCash = inflows - outflows;

    const headers = ['Descricao', 'Valor'];
    const rows = [
      ['RECEBIMENTOS OPERACIONAIS', ''],
      ['  Entradas', formatMoney(inflows)],
      ['', ''],
      ['(-) PAGAMENTOS OPERACIONAIS', ''],
      ['  Saidas', formatMoney(outflows)],
      ['', ''],
      ['(=) CAIXA LIQUIDO OPERACIONAL', formatMoney(netCash)],
    ];

    return { headers, rows };
  }
}
