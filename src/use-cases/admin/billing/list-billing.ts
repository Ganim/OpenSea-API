import {
  type TenantBillingDTO,
  tenantBillingToDTO,
} from '@/mappers/core/tenant-billing-mapper';
import type { TenantBillingsRepository } from '@/repositories/core/tenant-billings-repository';

interface ListBillingUseCaseRequest {
  status?: string;
}

interface ListBillingUseCaseResponse {
  billings: TenantBillingDTO[];
}

export class ListBillingUseCase {
  constructor(private tenantBillingsRepository: TenantBillingsRepository) {}

  async execute({
    status,
  }: ListBillingUseCaseRequest): Promise<ListBillingUseCaseResponse> {
    let billings;

    if (status) {
      billings = await this.tenantBillingsRepository.findByStatus(status);
    } else {
      // Fallback: get all by fetching each status
      const [pending, paid, overdue, cancelled] = await Promise.all([
        this.tenantBillingsRepository.findByStatus('PENDING'),
        this.tenantBillingsRepository.findByStatus('PAID'),
        this.tenantBillingsRepository.findByStatus('OVERDUE'),
        this.tenantBillingsRepository.findByStatus('CANCELLED'),
      ]);
      billings = [...pending, ...paid, ...overdue, ...cancelled];
    }

    return {
      billings: billings.map(tenantBillingToDTO),
    };
  }
}
