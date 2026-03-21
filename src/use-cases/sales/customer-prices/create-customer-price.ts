import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CustomerPrice } from '@/entities/sales/customer-price';
import type { CustomerPricesRepository } from '@/repositories/sales/customer-prices-repository';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';

interface CreateCustomerPriceUseCaseRequest {
  tenantId: string;
  customerId: string;
  variantId: string;
  price: number;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
  createdByUserId: string;
}

interface CreateCustomerPriceUseCaseResponse {
  customerPrice: CustomerPrice;
}

export class CreateCustomerPriceUseCase {
  constructor(
    private customerPricesRepository: CustomerPricesRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute(
    request: CreateCustomerPriceUseCaseRequest,
  ): Promise<CreateCustomerPriceUseCaseResponse> {
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(request.customerId),
      request.tenantId,
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found');
    }

    const existing = await this.customerPricesRepository.findByCustomerAndVariant(
      request.customerId,
      request.variantId,
      request.tenantId,
    );

    if (existing) {
      throw new ConflictError(
        'A custom price already exists for this customer and variant',
      );
    }

    const customerPrice = await this.customerPricesRepository.create({
      tenantId: request.tenantId,
      customerId: request.customerId,
      variantId: request.variantId,
      price: request.price,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      notes: request.notes,
      createdByUserId: request.createdByUserId,
    });

    return { customerPrice };
  }
}
