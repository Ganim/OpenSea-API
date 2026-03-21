import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PaymentCondition,
  type InterestType,
  type PaymentConditionApplicable,
  type PaymentConditionType,
} from '@/entities/sales/payment-condition';
import type { PaymentConditionsRepository } from '@/repositories/sales/payment-conditions-repository';

interface CreatePaymentConditionUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  type: PaymentConditionType;
  installments?: number;
  firstDueDays?: number;
  intervalDays?: number;
  downPaymentPercent?: number;
  interestRate?: number;
  interestType?: InterestType;
  penaltyRate?: number;
  discountCash?: number;
  applicableTo?: PaymentConditionApplicable;
  minOrderValue?: number;
  maxOrderValue?: number;
  isDefault?: boolean;
}

interface CreatePaymentConditionUseCaseResponse {
  paymentCondition: PaymentCondition;
}

export class CreatePaymentConditionUseCase {
  constructor(
    private paymentConditionsRepository: PaymentConditionsRepository,
  ) {}

  async execute(
    input: CreatePaymentConditionUseCaseRequest,
  ): Promise<CreatePaymentConditionUseCaseResponse> {
    const paymentCondition = PaymentCondition.create({
      tenantId: new UniqueEntityID(input.tenantId),
      name: input.name,
      description: input.description,
      type: input.type,
      installments: input.installments,
      firstDueDays: input.firstDueDays,
      intervalDays: input.intervalDays,
      downPaymentPercent: input.downPaymentPercent,
      interestRate: input.interestRate,
      interestType: input.interestType,
      penaltyRate: input.penaltyRate,
      discountCash: input.discountCash,
      applicableTo: input.applicableTo,
      minOrderValue: input.minOrderValue,
      maxOrderValue: input.maxOrderValue,
      isDefault: input.isDefault,
    });

    await this.paymentConditionsRepository.create(paymentCondition);

    return { paymentCondition };
  }
}
