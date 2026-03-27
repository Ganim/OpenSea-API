import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

// ─── Intent Types ─────────────────────────────────────────────────────────────

type FinanceQueryIntent =
  | 'EXPENSES_TOTAL'
  | 'INCOME_TOTAL'
  | 'OVERDUE_ENTRIES'
  | 'BALANCE'
  | 'FORECAST'
  | 'SUPPLIER_SUMMARY'
  | 'CUSTOMER_SUMMARY'
  | 'UPCOMING_PAYMENTS'
  | 'MONTHLY_SUMMARY'
  | 'UNKNOWN';

interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

// ─── Request / Response ───────────────────────────────────────────────────────

interface FinanceNaturalQueryRequest {
  tenantId: string;
  userId: string;
  query: string;
}

interface FinanceNaturalQueryResponse {
  answer: string;
  data?: Record<string, unknown>;
  intent: FinanceQueryIntent;
  confidence: number;
}

// ─── Intent Patterns ──────────────────────────────────────────────────────────

interface IntentPattern {
  intent: FinanceQueryIntent;
  patterns: RegExp[];
  confidence: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'OVERDUE_ENTRIES',
    patterns: [
      /vencid[ao]s?/i,
      /overdue/i,
      /atrasad[ao]s?/i,
      /em\s*atraso/i,
      /n[aã]o\s*pag[ao]/i,
      /contas?\s*vencid/i,
      /quem\s*(me\s*)?deve/i,
    ],
    confidence: 0.95,
  },
  {
    intent: 'EXPENSES_TOTAL',
    patterns: [
      /quanto\s*gast[eou]/i,
      /total\s*gasto/i,
      /despesas?/i,
      /gastos?/i,
      /contas?\s*a?\s*pagar/i,
      /sa[ií]d[ao]s?/i,
      /pagamentos?\s*(realizados?|feitos?)/i,
      /quanto\s*pagu?ei/i,
    ],
    confidence: 0.9,
  },
  {
    intent: 'INCOME_TOTAL',
    patterns: [
      /quanto\s*receb[ei]/i,
      /total\s*recebido/i,
      /receitas?/i,
      /faturamento/i,
      /contas?\s*a?\s*receber/i,
      /entradas?/i,
      /recebimentos?/i,
    ],
    confidence: 0.9,
  },
  {
    intent: 'FORECAST',
    patterns: [
      /previs[aã]o/i,
      /forecast/i,
      /pr[oó]ximos?\s*dias/i,
      /projeta[dr]/i,
      /proje[cç][aã]o/i,
      /vou\s*ter\s*dinheiro/i,
      /vai\s*sobrar/i,
      /vai\s*faltar/i,
    ],
    confidence: 0.92,
  },
  {
    intent: 'BALANCE',
    patterns: [
      /saldo/i,
      /caixa/i,
      /balance/i,
      /quanto\s*tenho/i,
      /quanto\s*tem/i,
      /dinheiro/i,
      /dispon[ií]vel/i,
      /posi[cç][aã]o/i,
    ],
    confidence: 0.9,
  },
  {
    intent: 'UPCOMING_PAYMENTS',
    patterns: [
      /vence[mn]?\s*(essa|esta|pr[oó]xima)\s*semana/i,
      /o\s*que\s*(tenho|tem)\s*(para|pra)\s*pagar/i,
      /pr[oó]ximos?\s*pagamentos?/i,
      /vencimentos?/i,
      /agenda\s*financeira/i,
    ],
    confidence: 0.85,
  },
  {
    intent: 'SUPPLIER_SUMMARY',
    patterns: [
      /fornecedor\s+(\S+)/i,
      /supplier/i,
      /quanto\s*paguei\s*(para|pro|pra)\s/i,
    ],
    confidence: 0.8,
  },
  {
    intent: 'CUSTOMER_SUMMARY',
    patterns: [
      /cliente\s+(\S+)/i,
      /customer/i,
      /quanto\s*(o|a)?\s*\S+\s*(me\s*)?deve/i,
    ],
    confidence: 0.8,
  },
  {
    intent: 'MONTHLY_SUMMARY',
    patterns: [
      /resumo/i,
      /como\s*est[aá]\s*(o\s*|meu\s*)?finance?iro/i,
      /vis[aã]o\s*geral/i,
      /summary/i,
      /panorama/i,
      /situa[cç][aã]o/i,
    ],
    confidence: 0.85,
  },
];

// ─── Time Period Extraction ───────────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  'mar\u00e7o': 2,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

function extractDateRange(query: string): DateRange {
  const now = new Date();
  const normalizedQuery = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // "últimos N meses"
  const lastNMonthsMatch = normalizedQuery.match(/ultimos?\s*(\d+)\s*mes(es)?/);
  if (lastNMonthsMatch) {
    const months = parseInt(lastNMonthsMatch[1], 10);
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1),
    );
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
    );
    return { from, to, label: `\u00FAltimos ${months} meses` };
  }

  // "este mês" / "mês atual"
  if (
    normalizedQuery.match(/este\s*mes/) ||
    normalizedQuery.match(/mes\s*atual/) ||
    normalizedQuery.match(/neste\s*mes/)
  ) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
    );
    return { from, to, label: 'este m\u00EAs' };
  }

  // "mês passado"
  if (normalizedQuery.match(/mes\s*passado/)) {
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59),
    );
    return { from, to, label: 'm\u00EAs passado' };
  }

  // "esta semana"
  if (
    normalizedQuery.match(/esta\s*semana/) ||
    normalizedQuery.match(/essa\s*semana/)
  ) {
    const dayOfWeek = now.getUTCDay();
    const from = new Date(now);
    from.setUTCDate(now.getUTCDate() - dayOfWeek);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setUTCDate(from.getUTCDate() + 6);
    to.setUTCHours(23, 59, 59, 999);
    return { from, to, label: 'esta semana' };
  }

  // "hoje"
  if (normalizedQuery.match(/\bhoje\b/)) {
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const to = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
      ),
    );
    return { from, to, label: 'hoje' };
  }

  // Named month: "janeiro", "fevereiro", etc.
  const normalizedQueryForMonth = query.toLowerCase();
  for (const [monthName, monthIndex] of Object.entries(MONTH_NAMES)) {
    if (normalizedQueryForMonth.includes(monthName)) {
      // Check if a year is specified
      const yearMatch = normalizedQueryForMonth.match(/20\d{2}/);
      const year = yearMatch
        ? parseInt(yearMatch[0], 10)
        : now.getUTCFullYear();
      const from = new Date(Date.UTC(year, monthIndex, 1));
      const to = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59));
      return { from, to, label: `${monthName} de ${year}` };
    }
  }

  // Year only: "2026", "2025"
  const yearOnlyMatch = normalizedQuery.match(/\b(20\d{2})\b/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[1], 10);
    const from = new Date(Date.UTC(year, 0, 1));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    return { from, to, label: `ano ${year}` };
  }

  // "últimos N dias"
  const lastNDaysMatch = normalizedQuery.match(/ultimos?\s*(\d+)\s*dias?/);
  if (lastNDaysMatch) {
    const days = parseInt(lastNDaysMatch[1], 10);
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setUTCHours(23, 59, 59, 999);
    return { from, to, label: `\u00FAltimos ${days} dias` };
  }

  // Default: current month
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
  );
  return { from, to, label: 'este m\u00EAs' };
}

// ─── Entity Name Extraction ───────────────────────────────────────────────────

function extractEntityName(query: string, keyword: string): string | undefined {
  const regex = new RegExp(`${keyword}\\s+([\\w\\s]+?)(?:\\s*[?.,!]|$)`, 'i');
  const match = query.match(regex);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

// ─── Currency Formatter ───────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// ─── Use Case ─────────────────────────────────────────────────────────────────

export class FinanceNaturalQueryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
  ) {}

  async execute(
    request: FinanceNaturalQueryRequest,
  ): Promise<FinanceNaturalQueryResponse> {
    const { tenantId, query } = request;

    const { intent, confidence } = this.detectIntent(query);
    const dateRange = extractDateRange(query);

    switch (intent) {
      case 'EXPENSES_TOTAL':
        return this.handleExpensesTotal(tenantId, dateRange, confidence);

      case 'INCOME_TOTAL':
        return this.handleIncomeTotal(tenantId, dateRange, confidence);

      case 'OVERDUE_ENTRIES':
        return this.handleOverdueEntries(tenantId, confidence);

      case 'BALANCE':
        return this.handleBalance(tenantId, confidence);

      case 'FORECAST':
        return this.handleForecast(tenantId, confidence);

      case 'UPCOMING_PAYMENTS':
        return this.handleUpcomingPayments(tenantId, confidence);

      case 'SUPPLIER_SUMMARY':
        return this.handleSupplierSummary(tenantId, query, confidence);

      case 'CUSTOMER_SUMMARY':
        return this.handleCustomerSummary(tenantId, query, confidence);

      case 'MONTHLY_SUMMARY':
        return this.handleMonthlySummary(tenantId, dateRange, confidence);

      default:
        return {
          answer:
            'Desculpe, n\u00E3o consegui entender sua pergunta. Tente algo como: "Quanto gastei este m\u00EAs?", "Contas vencidas", "Saldo atual" ou "Previs\u00E3o de caixa".',
          intent: 'UNKNOWN',
          confidence: 0,
        };
    }
  }

  // ─── Intent Detection ─────────────────────────────────────────────────────

  private detectIntent(query: string): {
    intent: FinanceQueryIntent;
    confidence: number;
  } {
    let bestMatch: { intent: FinanceQueryIntent; confidence: number } = {
      intent: 'UNKNOWN',
      confidence: 0,
    };

    for (const intentPattern of INTENT_PATTERNS) {
      for (const pattern of intentPattern.patterns) {
        if (pattern.test(query)) {
          if (intentPattern.confidence > bestMatch.confidence) {
            bestMatch = {
              intent: intentPattern.intent,
              confidence: intentPattern.confidence,
            };
          }
          break;
        }
      }
    }

    return bestMatch;
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  private async handleExpensesTotal(
    tenantId: string,
    dateRange: DateRange,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'PAYABLE',
      dueDateFrom: dateRange.from,
      dueDateTo: dateRange.to,
      page: 1,
      limit: 1000,
    });

    const totalExpected = entries.reduce(
      (sum, entry) => sum + entry.expectedAmount,
      0,
    );
    const totalPaid = entries
      .filter((e) => e.status === 'PAID')
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);
    const pendingCount = entries.filter(
      (e) => e.status === 'PENDING' || e.status === 'OVERDUE',
    ).length;

    const answer = [
      `No per\u00EDodo de ${dateRange.label}:`,
      `\u2022 Total em despesas: ${formatCurrency(totalExpected)}`,
      `\u2022 J\u00E1 pago: ${formatCurrency(totalPaid)}`,
      `\u2022 ${entries.length} lan\u00E7amento(s) no total`,
      pendingCount > 0
        ? `\u2022 ${pendingCount} ainda pendente(s) de pagamento`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      answer,
      data: {
        totalExpected,
        totalPaid,
        entryCount: entries.length,
        pendingCount,
        period: dateRange.label,
      },
      intent: 'EXPENSES_TOTAL',
      confidence,
    };
  }

  private async handleIncomeTotal(
    tenantId: string,
    dateRange: DateRange,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'RECEIVABLE',
      dueDateFrom: dateRange.from,
      dueDateTo: dateRange.to,
      page: 1,
      limit: 1000,
    });

    const totalExpected = entries.reduce(
      (sum, entry) => sum + entry.expectedAmount,
      0,
    );
    const totalReceived = entries
      .filter((e) => e.status === 'RECEIVED')
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);
    const pendingCount = entries.filter(
      (e) => e.status === 'PENDING' || e.status === 'OVERDUE',
    ).length;

    const answer = [
      `No per\u00EDodo de ${dateRange.label}:`,
      `\u2022 Total em receitas: ${formatCurrency(totalExpected)}`,
      `\u2022 J\u00E1 recebido: ${formatCurrency(totalReceived)}`,
      `\u2022 ${entries.length} lan\u00E7amento(s) no total`,
      pendingCount > 0
        ? `\u2022 ${pendingCount} ainda pendente(s) de recebimento`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      answer,
      data: {
        totalExpected,
        totalReceived,
        entryCount: entries.length,
        pendingCount,
        period: dateRange.label,
      },
      intent: 'INCOME_TOTAL',
      confidence,
    };
  }

  private async handleOverdueEntries(
    tenantId: string,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const { entries: overduePayables } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        isOverdue: true,
        page: 1,
        limit: 50,
        sortBy: 'dueDate',
        sortOrder: 'asc',
      });

    const { entries: overdueReceivables } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        isOverdue: true,
        page: 1,
        limit: 50,
        sortBy: 'dueDate',
        sortOrder: 'asc',
      });

    const totalOverduePayable = overduePayables.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );
    const totalOverdueReceivable = overdueReceivables.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );

    const lines: string[] = [];

    if (overduePayables.length === 0 && overdueReceivables.length === 0) {
      lines.push(
        'Parab\u00E9ns! Voc\u00EA n\u00E3o tem nenhuma conta vencida no momento.',
      );
    } else {
      if (overduePayables.length > 0) {
        lines.push(
          `Contas a pagar vencidas: ${overduePayables.length} (${formatCurrency(totalOverduePayable)})`,
        );
        for (const entry of overduePayables.slice(0, 5)) {
          const daysOverdue = Math.floor(
            (Date.now() - entry.dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          lines.push(
            `  \u2022 ${entry.description} \u2014 ${formatCurrency(entry.expectedAmount)} (${daysOverdue} dia(s) de atraso)`,
          );
        }
        if (overduePayables.length > 5) {
          lines.push(
            `  ... e mais ${overduePayables.length - 5} lan\u00E7amento(s)`,
          );
        }
      }

      if (overdueReceivables.length > 0) {
        if (overduePayables.length > 0) lines.push('');
        lines.push(
          `Contas a receber vencidas: ${overdueReceivables.length} (${formatCurrency(totalOverdueReceivable)})`,
        );
        for (const entry of overdueReceivables.slice(0, 5)) {
          const daysOverdue = Math.floor(
            (Date.now() - entry.dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          const partyName = entry.customerName ?? 'Cliente n\u00E3o informado';
          lines.push(
            `  \u2022 ${partyName} \u2014 ${formatCurrency(entry.expectedAmount)} (${daysOverdue} dia(s) de atraso)`,
          );
        }
        if (overdueReceivables.length > 5) {
          lines.push(
            `  ... e mais ${overdueReceivables.length - 5} lan\u00E7amento(s)`,
          );
        }
      }
    }

    return {
      answer: lines.join('\n'),
      data: {
        overduePayableCount: overduePayables.length,
        overdueReceivableCount: overdueReceivables.length,
        totalOverduePayable,
        totalOverdueReceivable,
      },
      intent: 'OVERDUE_ENTRIES',
      confidence,
    };
  }

  private async handleBalance(
    tenantId: string,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const bankAccounts = await this.bankAccountsRepository.findMany(tenantId);
    const activeAccounts = bankAccounts.filter((a) => a.isActive);
    const totalBalance = activeAccounts.reduce(
      (sum, a) => sum + a.currentBalance,
      0,
    );

    const lines = [`Saldo total em caixa: ${formatCurrency(totalBalance)}`, ''];

    if (activeAccounts.length > 0) {
      lines.push('Detalhamento por conta:');
      for (const account of activeAccounts) {
        lines.push(
          `  \u2022 ${account.name}: ${formatCurrency(account.currentBalance)}`,
        );
      }
    } else {
      lines.push('Nenhuma conta banc\u00E1ria ativa encontrada.');
    }

    return {
      answer: lines.join('\n'),
      data: {
        totalBalance,
        accountCount: activeAccounts.length,
        accounts: activeAccounts.map((a) => ({
          name: a.name,
          balance: a.currentBalance,
        })),
      },
      intent: 'BALANCE',
      confidence,
    };
  }

  private async handleForecast(
    tenantId: string,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [bankAccounts, payableResult, receivableResult] = await Promise.all([
      this.bankAccountsRepository.findMany(tenantId),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        status: 'PENDING',
        dueDateFrom: now,
        dueDateTo: in30Days,
        page: 1,
        limit: 1000,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        status: 'PENDING',
        dueDateFrom: now,
        dueDateTo: in30Days,
        page: 1,
        limit: 1000,
      }),
    ]);

    const currentBalance = bankAccounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    const expectedExpenses = payableResult.entries.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );
    const expectedIncome = receivableResult.entries.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );
    const projectedBalance = currentBalance + expectedIncome - expectedExpenses;

    const lines = [
      'Previs\u00E3o para os pr\u00F3ximos 30 dias:',
      `\u2022 Saldo atual: ${formatCurrency(currentBalance)}`,
      `\u2022 Receitas previstas: ${formatCurrency(expectedIncome)} (${receivableResult.entries.length} lan\u00E7amentos)`,
      `\u2022 Despesas previstas: ${formatCurrency(expectedExpenses)} (${payableResult.entries.length} lan\u00E7amentos)`,
      `\u2022 Saldo projetado: ${formatCurrency(projectedBalance)}`,
    ];

    if (projectedBalance < 0) {
      lines.push(
        '',
        '\u26A0\uFE0F Aten\u00E7\u00E3o: O saldo projetado ficar\u00E1 negativo! Considere antecipar recebimentos ou renegociar prazos.',
      );
    }

    return {
      answer: lines.join('\n'),
      data: {
        currentBalance,
        expectedIncome,
        expectedExpenses,
        projectedBalance,
        incomingCount: receivableResult.entries.length,
        outgoingCount: payableResult.entries.length,
      },
      intent: 'FORECAST',
      confidence,
    };
  }

  private async handleUpcomingPayments(
    tenantId: string,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'PAYABLE',
      status: 'PENDING',
      dueDateFrom: now,
      dueDateTo: in7Days,
      page: 1,
      limit: 50,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    });

    if (entries.length === 0) {
      return {
        answer:
          'Nenhum pagamento pendente nos pr\u00F3ximos 7 dias. Tudo em dia!',
        data: { entries: [], total: 0 },
        intent: 'UPCOMING_PAYMENTS',
        confidence,
      };
    }

    const totalUpcoming = entries.reduce((sum, e) => sum + e.expectedAmount, 0);

    const lines = [
      `Voc\u00EA tem ${entries.length} pagamento(s) nos pr\u00F3ximos 7 dias (${formatCurrency(totalUpcoming)}):`,
    ];

    for (const entry of entries.slice(0, 10)) {
      lines.push(
        `  \u2022 ${formatDate(entry.dueDate)} \u2014 ${entry.description}: ${formatCurrency(entry.expectedAmount)}`,
      );
    }

    if (entries.length > 10) {
      lines.push(`  ... e mais ${entries.length - 10} lan\u00E7amento(s)`);
    }

    return {
      answer: lines.join('\n'),
      data: {
        total: totalUpcoming,
        entryCount: entries.length,
      },
      intent: 'UPCOMING_PAYMENTS',
      confidence,
    };
  }

  private async handleSupplierSummary(
    tenantId: string,
    query: string,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const supplierName = extractEntityName(query, 'fornecedor');

    if (!supplierName) {
      return {
        answer:
          'Para consultar um fornecedor espec\u00EDfico, use: "fornecedor Nome da Empresa"',
        intent: 'SUPPLIER_SUMMARY',
        confidence: 0.5,
      };
    }

    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'PAYABLE',
      supplierName,
      page: 1,
      limit: 500,
    });

    if (entries.length === 0) {
      return {
        answer: `Nenhum lan\u00E7amento encontrado para o fornecedor "${supplierName}".`,
        data: { supplierName },
        intent: 'SUPPLIER_SUMMARY',
        confidence,
      };
    }

    const totalPaid = entries
      .filter((e) => e.status === 'PAID')
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);
    const totalPending = entries
      .filter((e) => e.status === 'PENDING' || e.status === 'OVERDUE')
      .reduce((sum, e) => sum + e.expectedAmount, 0);

    const lines = [
      `Resumo do fornecedor "${supplierName}":`,
      `\u2022 Total de lan\u00E7amentos: ${entries.length}`,
      `\u2022 Total pago: ${formatCurrency(totalPaid)}`,
      `\u2022 Pendente/Vencido: ${formatCurrency(totalPending)}`,
    ];

    return {
      answer: lines.join('\n'),
      data: {
        supplierName,
        entryCount: entries.length,
        totalPaid,
        totalPending,
      },
      intent: 'SUPPLIER_SUMMARY',
      confidence,
    };
  }

  private async handleCustomerSummary(
    tenantId: string,
    query: string,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const customerName = extractEntityName(query, 'cliente');

    if (!customerName) {
      return {
        answer:
          'Para consultar um cliente espec\u00EDfico, use: "cliente Nome do Cliente"',
        intent: 'CUSTOMER_SUMMARY',
        confidence: 0.5,
      };
    }

    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'RECEIVABLE',
      customerName,
      page: 1,
      limit: 500,
    });

    if (entries.length === 0) {
      return {
        answer: `Nenhum lan\u00E7amento encontrado para o cliente "${customerName}".`,
        data: { customerName },
        intent: 'CUSTOMER_SUMMARY',
        confidence,
      };
    }

    const totalReceived = entries
      .filter((e) => e.status === 'RECEIVED')
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);
    const totalPending = entries
      .filter((e) => e.status === 'PENDING' || e.status === 'OVERDUE')
      .reduce((sum, e) => sum + e.expectedAmount, 0);

    const lines = [
      `Resumo do cliente "${customerName}":`,
      `\u2022 Total de lan\u00E7amentos: ${entries.length}`,
      `\u2022 Total recebido: ${formatCurrency(totalReceived)}`,
      `\u2022 Pendente/Vencido: ${formatCurrency(totalPending)}`,
    ];

    return {
      answer: lines.join('\n'),
      data: {
        customerName,
        entryCount: entries.length,
        totalReceived,
        totalPending,
      },
      intent: 'CUSTOMER_SUMMARY',
      confidence,
    };
  }

  private async handleMonthlySummary(
    tenantId: string,
    dateRange: DateRange,
    confidence: number,
  ): Promise<FinanceNaturalQueryResponse> {
    const [payableResult, receivableResult, bankAccounts, overdueResult] =
      await Promise.all([
        this.financeEntriesRepository.findMany({
          tenantId,
          type: 'PAYABLE',
          dueDateFrom: dateRange.from,
          dueDateTo: dateRange.to,
          page: 1,
          limit: 1000,
        }),
        this.financeEntriesRepository.findMany({
          tenantId,
          type: 'RECEIVABLE',
          dueDateFrom: dateRange.from,
          dueDateTo: dateRange.to,
          page: 1,
          limit: 1000,
        }),
        this.bankAccountsRepository.findMany(tenantId),
        this.financeEntriesRepository.findMany({
          tenantId,
          isOverdue: true,
          page: 1,
          limit: 1,
        }),
      ]);

    const totalExpenses = payableResult.entries.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );
    const totalIncome = receivableResult.entries.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );
    const cashBalance = bankAccounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    const paidExpenses = payableResult.entries
      .filter((e) => e.status === 'PAID')
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);
    const receivedIncome = receivableResult.entries
      .filter((e) => e.status === 'RECEIVED')
      .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

    const lines = [
      `Resumo financeiro (${dateRange.label}):`,
      '',
      `\uD83D\uDCCA Vis\u00E3o geral:`,
      `\u2022 Receitas previstas: ${formatCurrency(totalIncome)}`,
      `\u2022 Despesas previstas: ${formatCurrency(totalExpenses)}`,
      `\u2022 Balan\u00E7o: ${formatCurrency(totalIncome - totalExpenses)}`,
      '',
      `\u2705 Realizado:`,
      `\u2022 Recebido: ${formatCurrency(receivedIncome)}`,
      `\u2022 Pago: ${formatCurrency(paidExpenses)}`,
      '',
      `\uD83C\uDFE6 Saldo em caixa: ${formatCurrency(cashBalance)}`,
    ];

    if (overdueResult.total > 0) {
      lines.push(
        '',
        `\u26A0\uFE0F ${overdueResult.total} lan\u00E7amento(s) vencido(s) requerem aten\u00E7\u00E3o.`,
      );
    }

    return {
      answer: lines.join('\n'),
      data: {
        totalIncome,
        totalExpenses,
        receivedIncome,
        paidExpenses,
        cashBalance,
        overdueCount: overdueResult.total,
        period: dateRange.label,
      },
      intent: 'MONTHLY_SUMMARY',
      confidence,
    };
  }
}
