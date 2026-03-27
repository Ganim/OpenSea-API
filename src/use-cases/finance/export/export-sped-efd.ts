import type { CompaniesRepository } from '@/repositories/core/companies-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryRetentionsRepository } from '@/repositories/finance/finance-entry-retentions-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface ExportSpedEfdRequest {
  tenantId: string;
  year: number;
  month: number;
  companyId?: string;
}

export interface SpedEfdResult {
  fileName: string;
  content: string;
  mimeType: string;
}

// SPED EFD-Contribuições helpers
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

export class ExportSpedEfdUseCase {
  constructor(
    private entriesRepository: FinanceEntriesRepository,
    private retentionsRepository: FinanceEntryRetentionsRepository,
    private companiesRepository: CompaniesRepository,
  ) {}

  async execute(request: ExportSpedEfdRequest): Promise<SpedEfdResult> {
    const { tenantId, year, month, companyId } = request;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

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

    // Fetch entries for the period
    const { entries } = await this.entriesRepository.findMany({
      tenantId,
      dueDateFrom: startDate,
      dueDateTo: endDate,
      companyId,
      limit: 50000,
    });

    // Fetch retentions for all entries
    const entryIds = entries.map((e) => e.id.toString());
    const retentions =
      entryIds.length > 0
        ? await this.retentionsRepository.findByEntryIds(entryIds, tenantId)
        : [];

    // Filter PIS and COFINS retentions
    const pisRetentions = retentions.filter((r) => r.taxType === 'PIS');
    const cofinsRetentions = retentions.filter((r) => r.taxType === 'COFINS');

    // Calculate PIS totals
    const pisTotalBase = pisRetentions.reduce(
      (sum, r) => sum + r.grossAmount,
      0,
    );
    const pisAvgRate =
      pisRetentions.length > 0
        ? pisRetentions.reduce((sum, r) => sum + r.rate, 0) /
          pisRetentions.length
        : 0.0065;
    const pisTotalValue = pisRetentions.reduce((sum, r) => sum + r.amount, 0);

    // Calculate COFINS totals
    const cofinsTotalBase = cofinsRetentions.reduce(
      (sum, r) => sum + r.grossAmount,
      0,
    );
    const cofinsAvgRate =
      cofinsRetentions.length > 0
        ? cofinsRetentions.reduce((sum, r) => sum + r.rate, 0) /
          cofinsRetentions.length
        : 0.03;
    const cofinsTotalValue = cofinsRetentions.reduce(
      (sum, r) => sum + r.amount,
      0,
    );

    // Build SPED EFD-Contribuições file
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
        '006', // COD_VER: Layout version 006
        '0', // TIPO_ESCRIT: 0 = Original
        '0', // IND_SIT_ESP: 0 = Normal
        String(pisRetentions.length + cofinsRetentions.length), // NUM_REC_ANTERIOR
        formatSpedDate(startDate), // DT_INI
        formatSpedDate(endDate), // DT_FIN
        companyName, // NOME
        companyCnpj, // CNPJ
        '', // UF
        '', // COD_MUN
        '', // SUFRAMA
        '1', // IND_NAT_PJ: 1 = Lucro Real
        '1', // IND_ATIV: 1 = Industrial
      ),
    );

    // 0001 — Opening indicator Block 0
    addLine('0001', spedLine('0001', '0')); // 0 = with data

    // 0100 — Accountant data (simplified)
    addLine(
      '0100',
      spedLine(
        '0100',
        companyName, // NOME
        companyCnpj, // CPF_CNPJ
        '', // CRC
        '', // CNPJ_ESCRITORIO
        '', // CEP
        '', // END
        '', // NUM
        '', // COMPL
        '', // BAIRRO
        '', // FONE
        '', // FAX
        '', // EMAIL
        '', // COD_MUN
      ),
    );

    // 0140 — Establishment (simplified)
    addLine(
      '0140',
      spedLine(
        '0140',
        '001', // COD_EST
        companyName, // NOME
        companyCnpj, // CNPJ
        '', // UF
        '', // IE
        '', // COD_MUN
        '', // IM
        '', // SUFRAMA
      ),
    );

    // =========================================================================
    // Block M: PIS/COFINS Apuration
    // =========================================================================

    // M001 — Opening Block M
    addLine('M001', spedLine('M001', '0'));

    // M200 — PIS Consolidation
    addLine(
      'M200',
      spedLine(
        'M200',
        formatSpedValue(pisTotalValue), // VL_TOT_CONT_NC_PER
        formatSpedValue(0), // VL_TOT_CRED_DESC
        formatSpedValue(pisTotalValue), // VL_TOT_CRED_DESC_ANT
        formatSpedValue(pisTotalValue), // VL_TOT_CONT_NC_DEV
        formatSpedValue(0), // VL_RET_NC
        formatSpedValue(0), // VL_OUT_DED_NC
        formatSpedValue(pisTotalValue), // VL_CONT_NC_REC
        formatSpedValue(0), // VL_TOT_CONT_CUM_PER
        formatSpedValue(0), // VL_RET_CUM
        formatSpedValue(0), // VL_OUT_DED_CUM
        formatSpedValue(0), // VL_CONT_CUM_REC
        formatSpedValue(pisTotalValue), // VL_TOT_CONT_REC
      ),
    );

    // M210 — PIS Detail per rate
    if (pisTotalBase > 0) {
      addLine(
        'M210',
        spedLine(
          'M210',
          '01', // COD_CONT: 01 = Non-cumulative
          formatSpedValue(pisTotalBase), // VL_REC_BRT
          formatSpedValue(pisTotalBase), // VL_BC_CONT
          formatSpedValue(pisAvgRate * 100), // ALIQ_PIS (percent)
          '1', // QUANT_BC_PIS
          formatSpedValue(pisAvgRate), // ALIQ_PIS_QUANT
          formatSpedValue(pisTotalValue), // VL_CONT_APUR
          formatSpedValue(0), // VL_AJUS_ACRES
          formatSpedValue(0), // VL_AJUS_REDUC
          formatSpedValue(pisTotalValue), // VL_CONT_DIFER
          formatSpedValue(0), // VL_CONT_DIFER_ANT
          formatSpedValue(pisTotalValue), // VL_CONT_PER
        ),
      );
    }

    // M600 — COFINS Consolidation
    addLine(
      'M600',
      spedLine(
        'M600',
        formatSpedValue(cofinsTotalValue), // VL_TOT_CONT_NC_PER
        formatSpedValue(0), // VL_TOT_CRED_DESC
        formatSpedValue(cofinsTotalValue), // VL_TOT_CRED_DESC_ANT
        formatSpedValue(cofinsTotalValue), // VL_TOT_CONT_NC_DEV
        formatSpedValue(0), // VL_RET_NC
        formatSpedValue(0), // VL_OUT_DED_NC
        formatSpedValue(cofinsTotalValue), // VL_CONT_NC_REC
        formatSpedValue(0), // VL_TOT_CONT_CUM_PER
        formatSpedValue(0), // VL_RET_CUM
        formatSpedValue(0), // VL_OUT_DED_CUM
        formatSpedValue(0), // VL_CONT_CUM_REC
        formatSpedValue(cofinsTotalValue), // VL_TOT_CONT_REC
      ),
    );

    // M610 — COFINS Detail per rate
    if (cofinsTotalBase > 0) {
      addLine(
        'M610',
        spedLine(
          'M610',
          '01', // COD_CONT: 01 = Non-cumulative
          formatSpedValue(cofinsTotalBase), // VL_REC_BRT
          formatSpedValue(cofinsTotalBase), // VL_BC_CONT
          formatSpedValue(cofinsAvgRate * 100), // ALIQ_COFINS (percent)
          '1', // QUANT_BC_COFINS
          formatSpedValue(cofinsAvgRate), // ALIQ_COFINS_QUANT
          formatSpedValue(cofinsTotalValue), // VL_CONT_APUR
          formatSpedValue(0), // VL_AJUS_ACRES
          formatSpedValue(0), // VL_AJUS_REDUC
          formatSpedValue(cofinsTotalValue), // VL_CONT_DIFER
          formatSpedValue(0), // VL_CONT_DIFER_ANT
          formatSpedValue(cofinsTotalValue), // VL_CONT_PER
        ),
      );
    }

    // =========================================================================
    // Block 9: Closing
    // =========================================================================

    // 9001 — Opening indicator Block 9
    addLine('9001', spedLine('9001', '0'));

    // 9900 — Record count per register
    const allRegisters = { ...registerCount };
    const reg9900Count = Object.keys(allRegisters).length + 2; // +2 for 9900 itself and 9999
    allRegisters['9900'] = reg9900Count;
    allRegisters['9999'] = 1;

    for (const [reg, count] of Object.entries(allRegisters).sort()) {
      addLine('9900', spedLine('9900', reg, String(count)));
    }

    // 9999 — Total record count
    const totalLines = lines.length + 1;
    addLine('9999', spedLine('9999', String(totalLines)));

    const content = lines.join('\r\n') + '\r\n';
    const fileName = `SPED_EFD_${year}_${pad(month, 2)}.txt`;

    return {
      fileName,
      content,
      mimeType: 'text/plain; charset=utf-8',
    };
  }
}
