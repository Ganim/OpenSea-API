import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { CustomersRepository } from '@/repositories/sales/customers-repository';

interface ListCustomersUseCaseRequest {
  page?: number;
  perPage?: number;
  type?: 'INDIVIDUAL' | 'BUSINESS';
  isActive?: boolean;
}

interface ListCustomersUseCaseResponse {
  customers: Array<{
    id: string;
    name: string;
    type: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
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
      allCustomers = await this.customersRepository.findManyActive(1, 999999);
    } else if (input.type) {
      allCustomers = await this.customersRepository.findManyByType(
        CustomerType.create(input.type),
        1,
        999999,
      );
    } else {
      allCustomers = await this.customersRepository.findMany(1, 999999);
    }

    const total = allCustomers.length;

    // Manual pagination
    const start = (page - 1) * perPage;
    const customers = allCustomers.slice(start, start + perPage);

    return {
      customers: customers.map((customer) => ({
        id: customer.id.toString(),
        name: customer.name,
        type: customer.type.value,
        document: customer.document?.value ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        address: customer.address ?? null,
        city: customer.city ?? null,
        state: customer.state ?? null,
        zipCode: customer.zipCode ?? null,
        country: customer.country ?? null,
        notes: customer.notes ?? null,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt ?? customer.createdAt,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
