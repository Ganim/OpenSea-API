import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ConsortiumDTO,
  consortiumToDTO,
} from '@/mappers/finance/consortium/consortium-to-dto';
import {
  type ConsortiumPaymentDTO,
  consortiumPaymentToDTO,
} from '@/mappers/finance/consortium-payment/consortium-payment-to-dto';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';
import type { ConsortiumPaymentsRepository } from '@/repositories/finance/consortium-payments-repository';

interface RegisterConsortiumPaymentUseCaseRequest {
  tenantId: string;
  consortiumId: string;
  paymentId: string;
  amount: number;
  paidAt: Date;
  bankAccountId?: string;
}

interface RegisterConsortiumPaymentUseCaseResponse {
  consortium: ConsortiumDTO;
  payment: ConsortiumPaymentDTO;
}

export class RegisterConsortiumPaymentUseCase {
  constructor(
    private consortiaRepository: ConsortiaRepository,
    private consortiumPaymentsRepository: ConsortiumPaymentsRepository,
  ) {}

  async execute(
    request: RegisterConsortiumPaymentUseCaseRequest,
  ): Promise<RegisterConsortiumPaymentUseCaseResponse> {
    const { tenantId, consortiumId, paymentId, amount, paidAt, bankAccountId } =
      request;

    // Validate consortium exists
    const consortium = await this.consortiaRepository.findById(
      new UniqueEntityID(consortiumId),
      tenantId,
    );
    if (!consortium) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    if (
      consortium.status === 'CANCELLED' ||
      consortium.status === 'WITHDRAWN'
    ) {
      throw new BadRequestError('Consortium is not active');
    }

    // Validate payment exists
    const payment = await this.consortiumPaymentsRepository.findById(
      new UniqueEntityID(paymentId),
    );
    if (!payment) {
      throw new ResourceNotFoundError('Payment not found');
    }

    if (payment.consortiumId.toString() !== consortiumId) {
      throw new BadRequestError('Payment does not belong to this consortium');
    }

    if (payment.isPaid) {
      throw new BadRequestError('Payment is already paid');
    }

    if (amount <= 0) {
      throw new BadRequestError('Payment amount must be positive');
    }

    // Update payment
    const updatedPayment = await this.consortiumPaymentsRepository.update({
      id: new UniqueEntityID(paymentId),
      paidAmount: amount,
      paidAt,
      status: 'PAID',
      bankAccountId: bankAccountId ?? null,
    });

    // Update consortium paid installments
    const newPaidInstallments = consortium.paidInstallments + 1;
    const isFullyPaid = newPaidInstallments >= consortium.totalInstallments;

    const updatedConsortium = await this.consortiaRepository.update({
      id: new UniqueEntityID(consortiumId),
      paidInstallments: newPaidInstallments,
      ...(isFullyPaid && { status: 'COMPLETED' }),
    });

    return {
      consortium: consortiumToDTO(updatedConsortium!),
      payment: consortiumPaymentToDTO(updatedPayment!),
    };
  }
}
