import type { TaxObligation, TaxType } from '@/entities/finance/tax-obligation';
import type { FinanceEntryRetentionsRepository } from '@/repositories/finance/finance-entry-retentions-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  TaxObligationsRepository,
  CreateTaxObligationSchema,
} from '@/repositories/finance/tax-obligations-repository';
import { isBusinessDay } from '@/utils/brazilian-holidays';

interface GenerateTaxObligationsRequest {
  tenantId: string;
  year: number;
  month: number;
}

export interface GenerateTaxObligationsResponse {
  created: TaxObligation[];
  skipped: number;
}

// DARF codes per tax type. ISS is a municipal tax (no federal DARF code), so
// we deliberately leave it undefined — the generator emits a municipal guide
// (GUIA_MUNICIPAL) instead of a DARF for ISS.
const DARF_CODES: Partial<Record<TaxType, string>> = {
  IRRF: '0561',
  INSS: '2631',
  PIS: '8109',
  COFINS: '2172',
  CSLL: '2372',
};

// Tax calendar rules: day of month for due date in the FOLLOWING month
// -1 means last business day of the month
const TAX_DUE_DAY: Record<TaxType, number> = {
  IRRF: -1, // Last business day of 2nd fortnight
  ISS: 15, // Day 15 of following month (default)
  INSS: 20, // Day 20 of following month
  PIS: 25, // Day 25 of following month
  COFINS: 25, // Day 25 of following month
  CSLL: -1, // Last business day of following month
};

/**
 * Returns the last business day of the given month, skipping weekends AND
 * Brazilian national holidays. `month` is 1-based (January = 1).
 */
export function getLastBusinessDayOfMonth(year: number, month: number): Date {
  const lastDay = new Date(year, month, 0);

  while (!isBusinessDay(lastDay)) {
    lastDay.setDate(lastDay.getDate() - 1);
  }

  return lastDay;
}

function calculateDueDate(
  taxType: TaxType,
  referenceYear: number,
  referenceMonth: number,
): Date {
  // Due date is in the FOLLOWING month
  let dueYear = referenceYear;
  let dueMonth = referenceMonth + 1;
  if (dueMonth > 12) {
    dueMonth = 1;
    dueYear++;
  }

  const dueDay = TAX_DUE_DAY[taxType];

  if (dueDay === -1) {
    return getLastBusinessDayOfMonth(dueYear, dueMonth);
  }

  // Ensure day doesn't exceed month length
  const lastDayOfMonth = new Date(dueYear, dueMonth, 0).getDate();
  const actualDay = Math.min(dueDay, lastDayOfMonth);

  const dueDate = new Date(dueYear, dueMonth - 1, actualDay);

  // If falls on weekend or national holiday, move forward to next business day
  while (!isBusinessDay(dueDate)) {
    dueDate.setDate(dueDate.getDate() + 1);
  }

  return dueDate;
}

export class GenerateTaxObligationsUseCase {
  constructor(
    private taxObligationsRepository: TaxObligationsRepository,
    private retentionsRepository: FinanceEntryRetentionsRepository,
    private entriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GenerateTaxObligationsRequest,
  ): Promise<GenerateTaxObligationsResponse> {
    const { tenantId, year, month } = request;

    // Fetch entries for the reference period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { entries } = await this.entriesRepository.findMany({
      tenantId,
      dueDateFrom: startDate,
      dueDateTo: endDate,
      limit: 50000,
    });

    // Fetch retentions for all entries in the period
    const entryIds = entries.map((e) => e.id.toString());
    const retentions =
      entryIds.length > 0
        ? await this.retentionsRepository.findByEntryIds(entryIds, tenantId)
        : [];

    // Aggregate retentions by tax type
    const retentionsByTaxType = new Map<TaxType, number>();
    for (const retention of retentions) {
      const taxType = retention.taxType as TaxType;
      const currentAmount = retentionsByTaxType.get(taxType) ?? 0;
      retentionsByTaxType.set(
        taxType,
        Math.round((currentAmount + retention.amount) * 100) / 100,
      );
    }

    // Generate obligations for each tax type with retentions
    const obligationsToCreate: CreateTaxObligationSchema[] = [];
    let skippedCount = 0;

    for (const [taxType, totalAmount] of retentionsByTaxType) {
      if (totalAmount <= 0) continue;

      // Check if obligation already exists for this period/tax type
      const existingObligation =
        await this.taxObligationsRepository.findByTaxTypeAndPeriod(
          tenantId,
          taxType,
          month,
          year,
        );

      if (existingObligation) {
        skippedCount++;
        continue;
      }

      const dueDate = calculateDueDate(taxType, year, month);

      obligationsToCreate.push({
        tenantId,
        taxType,
        referenceMonth: month,
        referenceYear: year,
        dueDate,
        amount: totalAmount,
        darfCode: DARF_CODES[taxType],
      });
    }

    const createdObligations =
      obligationsToCreate.length > 0
        ? await this.taxObligationsRepository.createMany(obligationsToCreate)
        : [];

    return {
      created: createdObligations,
      skipped: skippedCount,
    };
  }
}
