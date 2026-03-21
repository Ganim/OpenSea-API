import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PaymentCondition } from '@/entities/sales/payment-condition';
import type { PaymentConditionsRepository } from '@/repositories/sales/payment-conditions-repository';

interface UpdatePaymentConditionUseCaseRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  installments?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

interface UpdatePaymentConditionUseCaseResponse {
  paymentCondition: PaymentCondition;
}

export class UpdatePaymentConditionUseCase {
  constructor(
    private paymentConditionsRepository: PaymentConditionsRepository,
  ) {}

  async execute(
    input: UpdatePaymentConditionUseCaseRequest,
  ): Promise<UpdatePaymentConditionUseCaseResponse> {
    const paymentCondition =
      await this.paymentConditionsRepository.findById(
        new UniqueEntityID(input.id),
        input.tenantId,
      );

    if (!paymentCondition) {
      throw new ResourceNotFoundError('Payment condition not found.');
    }

    if (input.name !== undefined) paymentCondition.name = input.name;
    if (input.description !== undefined)
      paymentCondition.description = input.description;
    if (input.installments !== undefined)
      paymentCondition.installments = input.installments;
    if (input.isActive !== undefined)
      paymentCondition.isActive = input.isActive;
    if (input.isDefault !== undefined)
      paymentCondition.isDefault = input.isDefault;

    await this.paymentConditionsRepository.save(paymentCondition);

    return { paymentCondition };
  }
}
