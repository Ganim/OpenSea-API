import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CustomerPrice } from '@/entities/sales/customer-price';
import type { CustomerPricesRepository } from '@/repositories/sales/customer-prices-repository';

interface UpdateCustomerPriceUseCaseRequest {
  tenantId: string;
  id: string;
  price?: number;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
}

interface UpdateCustomerPriceUseCaseResponse {
  customerPrice: CustomerPrice;
}

export class UpdateCustomerPriceUseCase {
  constructor(private customerPricesRepository: CustomerPricesRepository) {}

  async execute(
    request: UpdateCustomerPriceUseCaseRequest,
  ): Promise<UpdateCustomerPriceUseCaseResponse> {
    const customerPrice = await this.customerPricesRepository.update({
      id: new UniqueEntityID(request.id),
      tenantId: request.tenantId,
      price: request.price,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      notes: request.notes,
    });

    if (!customerPrice) {
      throw new ResourceNotFoundError('Customer price not found');
    }

    return { customerPrice };
  }
}
