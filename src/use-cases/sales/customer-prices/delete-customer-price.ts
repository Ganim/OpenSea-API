import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CustomerPricesRepository } from '@/repositories/sales/customer-prices-repository';

interface DeleteCustomerPriceUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteCustomerPriceUseCaseResponse {
  message: string;
}

export class DeleteCustomerPriceUseCase {
  constructor(private customerPricesRepository: CustomerPricesRepository) {}

  async execute(
    request: DeleteCustomerPriceUseCaseRequest,
  ): Promise<DeleteCustomerPriceUseCaseResponse> {
    const customerPrice = await this.customerPricesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!customerPrice) {
      throw new ResourceNotFoundError('Customer price not found');
    }

    await this.customerPricesRepository.delete(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    return { message: 'Customer price deleted successfully.' };
  }
}
