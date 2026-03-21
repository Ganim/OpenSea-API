import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StoreCredit } from '@/entities/sales/store-credit';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { StoreCreditsRepository } from '@/repositories/sales/store-credits-repository';

interface CreateManualCreditUseCaseRequest {
  tenantId: string;
  customerId: string;
  amount: number;
  expiresAt?: string;
}

interface CreateManualCreditUseCaseResponse {
  storeCredit: StoreCredit;
}

export class CreateManualCreditUseCase {
  constructor(
    private storeCreditsRepository: StoreCreditsRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute(
    input: CreateManualCreditUseCaseRequest,
  ): Promise<CreateManualCreditUseCaseResponse> {
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(input.customerId),
      input.tenantId,
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    const storeCredit = StoreCredit.create({
      tenantId: new UniqueEntityID(input.tenantId),
      customerId: new UniqueEntityID(input.customerId),
      amount: input.amount,
      source: 'MANUAL',
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    await this.storeCreditsRepository.create(storeCredit);

    return { storeCredit };
  }
}
