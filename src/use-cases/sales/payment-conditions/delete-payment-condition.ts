import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PaymentConditionsRepository } from '@/repositories/sales/payment-conditions-repository';

interface DeletePaymentConditionUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeletePaymentConditionUseCase {
  constructor(
    private paymentConditionsRepository: PaymentConditionsRepository,
  ) {}

  async execute(input: DeletePaymentConditionUseCaseRequest): Promise<void> {
    const paymentCondition = await this.paymentConditionsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!paymentCondition) {
      throw new ResourceNotFoundError('Payment condition not found.');
    }

    await this.paymentConditionsRepository.delete(
      paymentCondition.id,
      input.tenantId,
    );
  }
}
