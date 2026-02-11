import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface ExportAccountingRequest {
  tenantId: string;
  format: 'CSV';
  reportType: 'ENTRIES' | 'BALANCE' | 'DRE' | 'CASHFLOW';
  startDate: Date;
  endDate: Date;
  type?: string;
  costCenterId?: string;
  categoryId?: string;
}

interface ExportAccountingResponse {
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

export class ExportAccountingDataUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: ExportAccountingRequest,
  ): Promise<ExportAccountingResponse> {
    const {
      tenantId,
      reportType,
      startDate,
      endDate,
      type,
      costCenterId,
      categoryId,
    } = request;

    switch (reportType) {
      case 'ENTRIES':
        return this.exportEntries(
          tenantId,
          startDate,
          endDate,
          type,
          costCenterId,
          categoryId,
        );
      case 'DRE':
        return this.exportDRE(tenantId, startDate, endDate);
      case 'BALANCE':
        return this.exportBalance(tenantId, startDate, endDate);
      case 'CASHFLOW':
        return this.exportCashflow(tenantId, startDate, endDate);
      default:
        throw new Error(`Tipo de relatório inválido: ${reportType}`);
    }
  }

  private async exportEntries(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    type?: string,
    costCenterId?: string,
    categoryId?: string,
  ): Promise<ExportAccountingResponse> {
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
      'Código',
      'Tipo',
      'Descrição',
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
      'Competência',
    ];

    const rows = entries.map((e) => [
      escapeCsvField(e.code),
      formatType(e.type),
      escapeCsvField(e.description),
      e.categoryId.toString(),
      e.costCenterId.toString(),
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

    const csv =
      UTF8_BOM +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const dateRange = `${formatDate(startDate).replace(/\//g, '-')}_${formatDate(endDate).replace(/\//g, '-')}`;

    return {
      fileName: `lancamentos_${dateRange}.csv`,
      data: Buffer.from(csv, 'utf-8'),
      mimeType: 'text/csv; charset=utf-8',
    };
  }

  private async exportDRE(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExportAccountingResponse> {
    // Revenue: RECEIVABLE entries that are PAID/RECEIVED in the period
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

    const headers = ['Descrição', 'Valor'];
    const rows = [
      ['RECEITAS', ''],
      ['  Receitas Operacionais', formatMoney(revenue)],
      ['', ''],
      ['(-) CUSTOS E DESPESAS', ''],
      ['  Despesas Operacionais', formatMoney(expenses)],
      ['', ''],
      ['(=) RESULTADO DO PERÍODO', formatMoney(result)],
    ];

    const csv =
      UTF8_BOM +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const dateRange = `${formatDate(startDate).replace(/\//g, '-')}_${formatDate(endDate).replace(/\//g, '-')}`;

    return {
      fileName: `dre_${dateRange}.csv`,
      data: Buffer.from(csv, 'utf-8'),
      mimeType: 'text/csv; charset=utf-8',
    };
  }

  private async exportBalance(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExportAccountingResponse> {
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

    const headers = ['Centro de Custo', 'Débitos', 'Créditos', 'Saldo'];
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

    const csv =
      UTF8_BOM +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const dateRange = `${formatDate(startDate).replace(/\//g, '-')}_${formatDate(endDate).replace(/\//g, '-')}`;

    return {
      fileName: `balancete_${dateRange}.csv`,
      data: Buffer.from(csv, 'utf-8'),
      mimeType: 'text/csv; charset=utf-8',
    };
  }

  private async exportCashflow(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExportAccountingResponse> {
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

    const headers = ['Descrição', 'Valor'];
    const rows = [
      ['RECEBIMENTOS OPERACIONAIS', ''],
      ['  Entradas', formatMoney(inflows)],
      ['', ''],
      ['(-) PAGAMENTOS OPERACIONAIS', ''],
      ['  Saídas', formatMoney(outflows)],
      ['', ''],
      ['(=) CAIXA LÍQUIDO OPERACIONAL', formatMoney(netCash)],
    ];

    const csv =
      UTF8_BOM +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const dateRange = `${formatDate(startDate).replace(/\//g, '-')}_${formatDate(endDate).replace(/\//g, '-')}`;

    return {
      fileName: `fluxo_caixa_${dateRange}.csv`,
      data: Buffer.from(csv, 'utf-8'),
      mimeType: 'text/csv; charset=utf-8',
    };
  }
}
