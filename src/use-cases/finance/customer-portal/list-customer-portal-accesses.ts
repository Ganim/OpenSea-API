import type {
  CustomerPortalAccessesRepository,
  CustomerPortalAccessRecord,
} from '@/repositories/finance/customer-portal-accesses-repository';

interface ListCustomerPortalAccessesRequest {
  tenantId: string;
}

interface ListCustomerPortalAccessesResponse {
  accesses: CustomerPortalAccessRecord[];
}

export class ListCustomerPortalAccessesUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
  ) {}

  async execute({
    tenantId,
  }: ListCustomerPortalAccessesRequest): Promise<ListCustomerPortalAccessesResponse> {
    const accesses =
      await this.customerPortalAccessesRepository.findMany(tenantId);

    return { accesses };
  }
}
