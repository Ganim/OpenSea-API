import type { CompaniesRepository } from '@/repositories/core/companies-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

const SIMPLES_NACIONAL_ANNUAL_LIMIT = 4_800_000;
const WARNING_THRESHOLD_PERCENT = 80;

interface ValidateSimplesNacionalRequest {
  tenantId: string;
  companyId?: string;
  year: number;
}

export type SimplesNacionalStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export interface ValidateSimplesNacionalResponse {
  regime: string;
  annualRevenue: number;
  limit: number;
  percentUsed: number;
  status: SimplesNacionalStatus;
  message: string;
}

export class ValidateSimplesNacionalUseCase {
  constructor(
    private entriesRepository: FinanceEntriesRepository,
    private companiesRepository: CompaniesRepository,
  ) {}

  async execute(
    request: ValidateSimplesNacionalRequest,
  ): Promise<ValidateSimplesNacionalResponse> {
    const { tenantId, year, companyId } = request;

    // Sum all RECEIVABLE entries with status PAID or RECEIVED for the year
    const yearStartDate = new Date(year, 0, 1);
    const yearEndDate = new Date(year, 11, 31);

    const { entries: receivableEntries } =
      await this.entriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        dueDateFrom: yearStartDate,
        dueDateTo: yearEndDate,
        companyId,
        limit: 50000,
      });

    const paidReceivedEntries = receivableEntries.filter(
      (entry) => entry.status === 'PAID' || entry.status === 'RECEIVED',
    );

    const annualRevenue = paidReceivedEntries.reduce(
      (sum, entry) =>
        sum +
        Math.round((entry.actualAmount ?? entry.expectedAmount) * 100) / 100,
      0,
    );

    const roundedRevenue = Math.round(annualRevenue * 100) / 100;

    // Determine regime from company (or assume SIMPLES)
    let regime = 'SIMPLES';
    if (companyId) {
      const companies = await this.companiesRepository.findManyActive(tenantId);
      const matchingCompany = companies.find(
        (c) => c.id.toString() === companyId,
      );
      if (matchingCompany?.taxRegime) {
        regime = matchingCompany.taxRegime;
      }
    }

    const percentUsed =
      Math.round((roundedRevenue / SIMPLES_NACIONAL_ANNUAL_LIMIT) * 10000) /
      100;

    let status: SimplesNacionalStatus;
    let message: string;

    if (percentUsed > 100) {
      status = 'EXCEEDED';
      message = 'Receita excede o limite do Simples Nacional';
    } else if (percentUsed >= WARNING_THRESHOLD_PERCENT) {
      status = 'WARNING';
      message = 'Receita se aproxima do limite do Simples Nacional';
    } else {
      status = 'OK';
      message = 'Receita dentro do limite do Simples Nacional';
    }

    return {
      regime,
      annualRevenue: roundedRevenue,
      limit: SIMPLES_NACIONAL_ANNUAL_LIMIT,
      percentUsed,
      status,
      message,
    };
  }
}
