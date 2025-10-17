import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomersRepository } from '@/repositories/sales/customers-repository';

interface GetCustomerByIdUseCaseRequest {
  id: string;
}

interface GetCustomerByIdUseCaseResponse {
  customer: {
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
  };
}

export class GetCustomerByIdUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute(
    input: GetCustomerByIdUseCaseRequest,
  ): Promise<GetCustomerByIdUseCaseResponse> {
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(input.id),
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    return {
      customer: {
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
      },
    };
  }
}
