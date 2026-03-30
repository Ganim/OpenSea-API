import type { CompaniesRepository } from '@/repositories/core/companies-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface ExportSpedEcdRequest {
  tenantId: string;
  year: number;
  companyId?: string;
}

export interface SpedEcdResult {
  content: string;
  fileName: string;
  recordCount: number;
}

function pad(value: string | number, length: number, char = '0'): string {
  return String(value).padStart(length, char);
}

function formatSpedDate(date: Date): string {
  const d = new Date(date);
  return `${pad(d.getDate(), 2)}${pad(d.getMonth() + 1, 2)}${d.getFullYear()}`;
}

function formatSpedValue(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function spedLine(...fields: string[]): string {
  return `|${fields.join('|')}|`;
}

interface MonthlyTrialBalance {
  month: number;
  startDate: Date;
  endDate: Date;
  accounts: Map<
    string,
    { accountName: string; debit: number; credit: number; balance: number }
  >;
}

export class ExportSpedEcdUseCase {
  constructor(
    private entriesRepository: FinanceEntriesRepository,
    private categoriesRepository: FinanceCategoriesRepository,
    private companiesRepository: CompaniesRepository,
  ) {}

  async execute(request: ExportSpedEcdRequest): Promise<SpedEcdResult> {
    const { tenantId, year, companyId } = request;

    // Fetch company info
    let companyName = 'EMPRESA';
    let companyCnpj = '00000000000000';

    if (companyId) {
      const company = await this.companiesRepository.findById(
        new UniqueEntityID(companyId),
        tenantId,
      );
      if (company) {
        companyName = company.legalName;
        companyCnpj = company.cnpj.replace(/\D/g, '');
      }
    }

    // Fetch chart of accounts (using finance categories as proxy)
    const categories = await this.categoriesRepository.findMany(tenantId);

    // Fetch entries for the entire year grouped by month
    const yearStartDate = new Date(year, 0, 1);
    const yearEndDate = new Date(year, 11, 31);

    const { entries: yearEntries } = await this.entriesRepository.findMany({
      tenantId,
      dueDateFrom: yearStartDate,
      dueDateTo: yearEndDate,
      companyId,
      limit: 50000,
    });

    // Group entries by month for trial balance
    const monthlyBalances = this.buildMonthlyTrialBalances(
      yearEntries,
      categories,
      year,
    );

    // Build SPED ECD file
    const lines: string[] = [];
    const registerCount: Record<string, number> = {};

    function addLine(register: string, line: string) {
      lines.push(line);
      registerCount[register] = (registerCount[register] ?? 0) + 1;
    }

    // =========================================================================
    // Block 0: Opening
    // =========================================================================

    addLine(
      '0000',
      spedLine(
        '0000',
        'LECD', // Identifier
        formatSpedDate(yearStartDate), // DT_INI
        formatSpedDate(yearEndDate), // DT_FIN
        companyName, // NOME
        companyCnpj, // CNPJ
        '', // UF
        '', // IE
        '', // COD_MUN
        '', // IM
        '0', // IND_SIT_ESP: Normal
        '0', // IND_SIT_INI_PER: Normal
        '0', // IND_NIRE
        '0', // IND_FIN_ESC: Normal
        '', // COD_HASH_SUB
        '0', // IND_GRANDE_PORTE
        '0', // TIP_ECD: 0 = Contábil completa
        '', // COD_SCP
        '', // IDENT_MF
        '', // IND_ESC_CONS
        '', // IND_CENTRALIZADA
        '', // IND_MUDANCA_PC
        '', // COD_PLAN_REF
      ),
    );

    // 0001 — Block 0 opening indicator
    addLine('0001', spedLine('0001', '0'));

    // 0007 — Additional info (simplified)
    addLine('0007', spedLine('0007', ''));

    // 0990 — Block 0 closing
    const block0Count = Object.keys(registerCount).reduce(
      (sum, k) => (k.startsWith('0') ? sum + registerCount[k] : sum),
      0,
    );
    addLine('0990', spedLine('0990', String(block0Count + 1)));

    // =========================================================================
    // Block I: Accounting entries
    // =========================================================================

    // I001 — Block I opening
    addLine('I001', spedLine('I001', '0'));

    // I010 — Chart of accounts indicator
    addLine('I010', spedLine('I010', 'G')); // G = own chart, P = standard

    // I012 — Reference books
    addLine(
      'I012',
      spedLine(
        'I012',
        'DIARIO GERAL', // NUM_ORD
        '1', // NAT_LIVR
        '0', // QTD_LIN
        '', // NOME
        '', // NIRE
        '', // CNPJ
        formatSpedDate(yearStartDate), // DT_ARQ
        '', // DESC_MUN
      ),
    );

    // I015 — Account holders (simplified)
    addLine('I015', spedLine('I015', companyCnpj, companyName));

    // I050 — Chart of accounts records
    for (const category of categories) {
      const accountCode = category.id.toString().substring(0, 8).toUpperCase();
      const accountType = this.mapCategoryTypeToAccountType(category.type);

      addLine(
        'I050',
        spedLine(
          'I050',
          formatSpedDate(yearStartDate), // DT_ALT
          accountType, // COD_NAT
          '1', // IND_CTA: A = Analítica
          '1', // NIVEL
          accountCode, // COD_CTA
          category.name, // COD_CTA_REF
          category.name, // NOME_CTA
        ),
      );
    }

    // I150/I155 — Monthly trial balance
    for (const monthBalance of monthlyBalances) {
      addLine(
        'I150',
        spedLine(
          'I150',
          formatSpedDate(monthBalance.startDate), // DT_INI
          formatSpedDate(monthBalance.endDate), // DT_FIN
        ),
      );

      for (const [accountCode, accountData] of monthBalance.accounts) {
        addLine(
          'I155',
          spedLine(
            'I155',
            accountCode, // COD_CTA
            accountData.accountName, // COD_CCUS
            formatSpedValue(Math.max(0, accountData.balance)), // VL_SLD_INI
            'D', // IND_DC_INI
            formatSpedValue(accountData.debit), // VL_DEB
            formatSpedValue(accountData.credit), // VL_CRED
            formatSpedValue(Math.abs(accountData.balance)), // VL_SLD_FIN
            accountData.balance >= 0 ? 'D' : 'C', // IND_DC_FIN
          ),
        );
      }
    }

    // I200/I250 — Journal entries
    let journalEntrySequence = 1;
    for (const entry of yearEntries) {
      const entryDate = entry.dueDate;
      const accountCode = entry.categoryId
        .toString()
        .substring(0, 8)
        .toUpperCase();

      addLine(
        'I200',
        spedLine(
          'I200',
          String(journalEntrySequence), // NUM_LCTO
          formatSpedDate(entryDate), // DT_LCTO
          formatSpedValue(entry.expectedAmount), // VL_LCTO
          entry.isPayable ? 'N' : 'S', // IND_LCTO: N = Normal, S = Encerramento
        ),
      );

      const debitOrCredit = entry.isPayable ? 'D' : 'C';
      addLine(
        'I250',
        spedLine(
          'I250',
          accountCode, // COD_CTA
          accountCode, // COD_CCUS
          formatSpedValue(entry.expectedAmount), // VL_DC
          debitOrCredit, // IND_DC
          String(journalEntrySequence), // NUM_ARQ
          entry.description.substring(0, 200), // COD_HIS_PAD
          '', // HIS
        ),
      );

      journalEntrySequence++;
    }

    // I990 — Block I closing
    const blockICount = Object.keys(registerCount).reduce(
      (sum, k) => (k.startsWith('I') ? sum + registerCount[k] : sum),
      0,
    );
    addLine('I990', spedLine('I990', String(blockICount + 1)));

    // =========================================================================
    // Block 9: Closing
    // =========================================================================

    addLine('9001', spedLine('9001', '0'));

    // 9900 — Record count per register
    const allRegisters = { ...registerCount };
    const reg9900Count = Object.keys(allRegisters).length + 2;
    allRegisters['9900'] = reg9900Count;
    allRegisters['9999'] = 1;

    for (const [reg, count] of Object.entries(allRegisters).sort()) {
      addLine('9900', spedLine('9900', reg, String(count)));
    }

    // 9990 — Block 9 closing
    const block9Count = Object.keys(registerCount).reduce(
      (sum, k) => (k.startsWith('9') ? sum + registerCount[k] : sum),
      0,
    );
    addLine('9990', spedLine('9990', String(block9Count + 1)));

    // 9999 — Total record count
    const totalLines = lines.length + 1;
    addLine('9999', spedLine('9999', String(totalLines)));

    const content = lines.join('\r\n') + '\r\n';
    const fileName = `SPED_ECD_${year}.txt`;

    return {
      content,
      fileName,
      recordCount: totalLines,
    };
  }

  private buildMonthlyTrialBalances(
    entries: {
      categoryId: { toString(): string };
      type: string;
      expectedAmount: number;
      dueDate: Date;
    }[],
    categories: { id: { toString(): string }; name: string; type: string }[],
    year: number,
  ): MonthlyTrialBalance[] {
    const categoryMap = new Map(categories.map((c) => [c.id.toString(), c]));

    const monthlyBalances: MonthlyTrialBalance[] = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const monthEntries = entries.filter((e) => {
        const entryMonth = e.dueDate.getMonth() + 1;
        return entryMonth === month;
      });

      const accounts = new Map<
        string,
        { accountName: string; debit: number; credit: number; balance: number }
      >();

      for (const entry of monthEntries) {
        const accountCode = entry.categoryId
          .toString()
          .substring(0, 8)
          .toUpperCase();
        const category = categoryMap.get(entry.categoryId.toString());
        const accountName = category?.name ?? 'Conta';

        if (!accounts.has(accountCode)) {
          accounts.set(accountCode, {
            accountName,
            debit: 0,
            credit: 0,
            balance: 0,
          });
        }

        const accountRecord = accounts.get(accountCode)!;
        const amount = Math.round(entry.expectedAmount * 100) / 100;

        if (entry.type === 'PAYABLE') {
          accountRecord.debit += amount;
          accountRecord.balance += amount;
        } else {
          accountRecord.credit += amount;
          accountRecord.balance -= amount;
        }
      }

      if (accounts.size > 0) {
        monthlyBalances.push({ month, startDate, endDate, accounts });
      }
    }

    return monthlyBalances;
  }

  private mapCategoryTypeToAccountType(categoryType: string): string {
    switch (categoryType) {
      case 'EXPENSE':
        return '04'; // Despesa
      case 'REVENUE':
        return '03'; // Receita
      default:
        return '01'; // Ativo
    }
  }
}
