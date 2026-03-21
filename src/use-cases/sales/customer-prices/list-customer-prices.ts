import type { CustomerPriceDTO } from '@/mappers/sales/customer-price/customer-price-to-dto';
import { customerPriceToDTO } from '@/mappers/sales/customer-price/customer-price-to-dto';
import type { CustomerPricesRepository } from '@/repositories/sales/customer-prices-repository';

interface ListCustomerPricesUseCaseRequest {
  tenantId: string;
  customerId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListCustomerPricesUseCaseResponse {
  customerPrices: CustomerPriceDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListCustomerPricesUseCase {
  constructor(private customerPricesRepository: CustomerPricesRepository) {}

  async execute(
    request: ListCustomerPricesUseCaseRequest,
  ): Promise<ListCustomerPricesUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const result = await this.customerPricesRepository.findManyByCustomer({
      tenantId: request.tenantId,
      customerId: request.customerId,
      page,
      limit,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    });

    return {
      customerPrices: result.data.map(customerPriceToDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
