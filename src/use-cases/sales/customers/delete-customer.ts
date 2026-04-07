import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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

    // Guard: system customers (e.g., default PDV customer) cannot be deleted
    if (customer.isSystem) {
      throw new BadRequestError('Não é possível excluir entidades do sistema.');
    }

    customer.delete();
    await this.customersRepository.save(customer);

    return {
      message: 'Customer deleted successfully.',
    };
  }
}
