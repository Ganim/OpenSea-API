import type {
  TaxObligationsRepository,
  FindManyTaxObligationsResult,
} from '@/repositories/finance/tax-obligations-repository';
import type {
  TaxObligationStatus,
  TaxType,
} from '@/entities/finance/tax-obligation';

interface ListTaxObligationsRequest {
  tenantId: string;
  year?: number;
  month?: number;
  status?: TaxObligationStatus;
  taxType?: TaxType;
  page?: number;
  limit?: number;
}

export class ListTaxObligationsUseCase {
  constructor(private taxObligationsRepository: TaxObligationsRepository) {}

  async execute(
    request: ListTaxObligationsRequest,
  ): Promise<FindManyTaxObligationsResult> {
    return this.taxObligationsRepository.findMany({
      tenantId: request.tenantId,
      year: request.year,
      month: request.month,
      status: request.status,
      taxType: request.taxType,
      page: request.page,
      limit: request.limit,
    });
  }
}
