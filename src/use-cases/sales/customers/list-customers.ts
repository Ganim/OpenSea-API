import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import type { CustomerDTO } from '@/mappers/sales/customer/customer-to-dto';
import { customerToDTO } from '@/mappers/sales/customer/customer-to-dto';
import { CustomersRepository } from '@/repositories/sales/customers-repository';

interface ListCustomersUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  type?: 'INDIVIDUAL' | 'BUSINESS';
  isActive?: boolean;
}

interface ListCustomersUseCaseResponse {
  customers: CustomerDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListCustomersUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute(
    input: ListCustomersUseCaseRequest,
  ): Promise<ListCustomersUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    // Get all customers (pagination will be done manually)
    let allCustomers;

    if (input.isActive !== undefined) {
      allCustomers = await this.customersRepository.findManyActive(
        1,
        999999,
        input.tenantId,
      );
    } else if (input.type) {
      allCustomers = await this.customersRepository.findManyByType(
        CustomerType.create(input.type),
        1,
        999999,
        input.tenantId,
      );
    } else {
      allCustomers = await this.customersRepository.findMany(
        1,
        999999,
        input.tenantId,
      );
    }

    const total = allCustomers.length;

    // Manual pagination
    const start = (page - 1) * perPage;
    const customers = allCustomers.slice(start, start + perPage);

    return {
      customers: customers.map(customerToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
