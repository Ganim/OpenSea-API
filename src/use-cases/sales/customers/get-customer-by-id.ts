import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CustomerDTO } from '@/mappers/sales/customer/customer-to-dto';
import { customerToDTO } from '@/mappers/sales/customer/customer-to-dto';
import { CustomersRepository } from '@/repositories/sales/customers-repository';

interface GetCustomerByIdUseCaseRequest {
  id: string;
}

interface GetCustomerByIdUseCaseResponse {
  customer: CustomerDTO;
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
      customer: customerToDTO(customer),
    };
  }
}
