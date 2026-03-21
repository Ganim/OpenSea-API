import {
  type TenantBillingDTO,
  tenantBillingToDTO,
} from '@/mappers/core/tenant-billing-mapper';
import type { TenantBillingsRepository } from '@/repositories/core/tenant-billings-repository';

interface GetTenantBillingUseCaseRequest {
  tenantId: string;
}

interface GetTenantBillingUseCaseResponse {
  billings: TenantBillingDTO[];
}

export class GetTenantBillingUseCase {
  constructor(private tenantBillingsRepository: TenantBillingsRepository) {}

  async execute({
    tenantId,
  }: GetTenantBillingUseCaseRequest): Promise<GetTenantBillingUseCaseResponse> {
    const billings =
      await this.tenantBillingsRepository.findByTenantId(tenantId);

    return {
      billings: billings.map(tenantBillingToDTO),
    };
  }
}
