import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomersRepository } from '@/repositories/sales/customers-repository';

interface DeleteCustomerUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteCustomerUseCaseResponse {
  message: string;
}

export class DeleteCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute(
    input: DeleteCustomerUseCaseRequest,
  ): Promise<DeleteCustomerUseCaseResponse> {
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    customer.delete();
    await this.customersRepository.save(customer);

    return {
      message: 'Customer deleted successfully.',
    };
  }
}
