/**
 * SPED ECD (Escrituração Contábil Digital) Export Service
 *
 * Generates SPED-compliant fixed-width text files with pipe `|` delimiters.
 * Follows the Brazilian government specification for digital accounting records.
 *
 * Registers implemented (ECD):
 * - 0000: Opening record (identification)
 * - 0001: Opening Block 0
 * - I001: Opening Block I
 * - I010: Identification of the bookkeeping
 * - I050: Chart of Accounts
 * - I150: Monthly balance period
 * - I155: Monthly balance detail
 * - I200: Journal entries header
 * - I250: Journal entry lines
 * - 9001: Opening Block 9
 * - 9900: Record count per register
 * - 9999: Closing record
 */

import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

export type SpedFormat = 'ECD' | 'ECF' | 'EFD_CONTRIBUICOES';

export interface SpedExportParams {
  tenantId: string;
  year: number;
  startMonth: number;
  endMonth: number;
  format: SpedFormat;
  companyName?: string;
  cnpj?: string;
}

export interface SpedExportResult {
  fileName: string;
  data: Buffer;
  mimeType: string;
}

// =============================================================================
// HELPERS
// =============================================================================

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

// =============================================================================
// SERVICE
// =============================================================================

export class SpedExportService {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async export(params: SpedExportParams): Promise<SpedExportResult> {
    if (params.format !== 'ECD') {
      throw new Error(
        `Formato SPED '${params.format}' ainda não implementado. Apenas ECD está disponível.`,
      );
    }

    return this.exportECD(params);
  }

  private async exportECD(params: SpedExportParams): Promise<SpedExportResult> {
    const { tenantId, year, startMonth, endMonth, companyName, cnpj } = params;

    const startDate = new Date(year, startMonth - 1, 1);
    const endDate = new Date(year, endMonth, 0); // Last day of endMonth

    // Fetch data
    const categories = await this.financeCategoriesRepository.findMany(
      tenantId,
    );

    const { entries } = await this.financeEntriesRepository.findMany({
      tenantId,
      dueDateFrom: startDate,
      dueDateTo: endDate,
      limit: 50000,
    });

    const lines: string[] = [];
    const registerCount: Record<string, number> = {};

    function addLine(register: string, line: string) {
      lines.push(line);
      registerCount[register] = (registerCount[register] ?? 0) + 1;
    }

    // =========================================================================
    // Block 0: Opening
    // =========================================================================

    // 0000 — Opening record
    addLine(
      '0000',
      spedLine(
        '0000',
        'LECD', // ECD identifier
        formatSpedDate(startDate),
        formatSpedDate(endDate),
        companyName ?? 'EMPRESA',
        cnpj ?? '00000000000000',
        '', // UF
        '', // IE
        '', // COD_MUN
        '', // IM
        '', // IND_SIT_ESP
        '', // IND_SIT_INI_PER
        '', // IND_NIRE
        '', // IND_FIN_ESC
        '', // COD_HASH_SUB
        '', // NIRE_SUBST
        '', // IND_GRANDE_PORTE
        '', // TIP_ECD
        '', // COD_SCP
        '', // IDENT_MF
      ),
    );

    // 0001 — Opening indicator Block 0
    addLine('0001', spedLine('0001', '0')); // 0 = with data

    // =========================================================================
    // Block I: Journal Entries
    // =========================================================================

    // I001 — Opening indicator Block I
    addLine('I001', spedLine('I001', '0'));

    // I010 — Identification of bookkeeping
    addLine(
      'I010',
      spedLine(
        'I010',
        'G', // IND_ESC: G = General Journal
        'R', // COD_VER_LC: R = Real time
      ),
    );

    // I050 — Chart of Accounts (from categories)
    const chartOfAccounts = categories.map((cat, idx) => {
      const code = pad(idx + 1, 5);
      const type = cat.type === 'EXPENSE' ? 'D' : cat.type === 'REVENUE' ? 'C' : 'D';
      return { id: cat.id.toString(), code, name: cat.name, type };
    });

    for (const account of chartOfAccounts) {
      addLine(
        'I050',
        spedLine(
          'I050',
          formatSpedDate(startDate), // DT_ALT
          'A', // COD_NAT: A = Analytical
          '', // IND_CTA: empty
          '1', // NIVEL
          account.code, // COD_CTA
          account.name, // COD_CTA_REF
          account.name, // NOME_CTA
        ),
      );
    }

    // Group entries by month for balances
    const entriesByMonth: Record<number, typeof entries> = {};
    for (const entry of entries) {
      const month = new Date(entry.dueDate).getMonth() + 1;
      if (!entriesByMonth[month]) entriesByMonth[month] = [];
      entriesByMonth[month].push(entry);
    }

    // I150/I155 — Monthly balances
    for (let month = startMonth; month <= endMonth; month++) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      addLine(
        'I150',
        spedLine(
          'I150',
          formatSpedDate(monthStart),
          formatSpedDate(monthEnd),
        ),
      );

      // Balance by account
      const monthEntries = entriesByMonth[month] ?? [];
      const balanceByCategory: Record<
        string,
        { debit: number; credit: number }
      > = {};

      for (const entry of monthEntries) {
        const catId = entry.categoryId.toString();
        if (!balanceByCategory[catId]) {
          balanceByCategory[catId] = { debit: 0, credit: 0 };
        }
        const amount = entry.actualAmount ?? entry.expectedAmount;
        if (entry.type === 'PAYABLE') {
          balanceByCategory[catId].debit += amount;
        } else {
          balanceByCategory[catId].credit += amount;
        }
      }

      for (const [catId, balance] of Object.entries(balanceByCategory)) {
        const account = chartOfAccounts.find((a) => a.id === catId);
        if (!account) continue;

        addLine(
          'I155',
          spedLine(
            'I155',
            account.code,
            account.name,
            formatSpedValue(0), // VL_SLD_INI
            balance.debit > 0 ? 'D' : 'C', // IND_DC_INI
            formatSpedValue(balance.debit), // VL_DEB
            formatSpedValue(balance.credit), // VL_CRED
            formatSpedValue(
              Math.abs(balance.credit - balance.debit),
            ), // VL_SLD_FIN
            balance.credit >= balance.debit ? 'C' : 'D', // IND_DC_FIN
          ),
        );
      }
    }

    // I200/I250 — Journal entries (individual)
    let entrySeq = 1;
    for (const entry of entries) {
      const account = chartOfAccounts.find(
        (a) => a.id === entry.categoryId.toString(),
      );
      if (!account) continue;

      const amount = entry.actualAmount ?? entry.expectedAmount;

      addLine(
        'I200',
        spedLine(
          'I200',
          pad(entrySeq, 8), // NUM_LCTO
          formatSpedDate(entry.dueDate), // DT_LCTO
          formatSpedValue(amount), // VL_LCTO
          entry.type === 'PAYABLE' ? 'N' : 'N', // IND_LCTO: N = Normal
        ),
      );

      // Debit line
      addLine(
        'I250',
        spedLine(
          'I250',
          account.code, // COD_CTA
          account.name, // COD_CCUS
          formatSpedValue(amount), // VL_DC
          entry.type === 'PAYABLE' ? 'D' : 'C', // IND_DC
          pad(entrySeq, 8), // NUM_ARQ
          entry.description, // COD_HIST_PAD
          entry.description, // HIST
        ),
      );

      entrySeq++;
    }

    // =========================================================================
    // Block 9: Closing
    // =========================================================================

    // 9001 — Opening indicator Block 9
    addLine('9001', spedLine('9001', '0'));

    // 9900 — Record count per register
    const allRegisters = { ...registerCount };
    // We need to account for 9900 lines themselves plus 9999
    const reg9900Count = Object.keys(allRegisters).length + 2; // +2 for 9900 itself and 9999
    allRegisters['9900'] = reg9900Count;
    allRegisters['9999'] = 1;

    for (const [reg, count] of Object.entries(allRegisters).sort()) {
      addLine(
        '9900',
        spedLine('9900', reg, String(count)),
      );
    }

    // 9999 — Total record count
    const totalLines = lines.length + 1; // +1 for this line
    addLine('9999', spedLine('9999', String(totalLines)));

    // Build file
    const content = lines.join('\r\n') + '\r\n';
    const data = Buffer.from(content, 'utf-8');
    const fileName = `SPED_ECD_${year}_${pad(startMonth, 2)}_${pad(endMonth, 2)}.txt`;

    return {
      fileName,
      data,
      mimeType: 'text/plain; charset=utf-8',
    };
  }
}
