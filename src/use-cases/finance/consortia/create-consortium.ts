import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ConsortiumDTO,
  consortiumToDTO,
} from '@/mappers/finance/consortium/consortium-to-dto';
import {
  type ConsortiumPaymentDTO,
  consortiumPaymentToDTO,
} from '@/mappers/finance/consortium-payment/consortium-payment-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';
import type { ConsortiumPaymentsRepository } from '@/repositories/finance/consortium-payments-repository';

interface CreateConsortiumUseCaseRequest {
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  administrator: string;
  creditValue: number;
  monthlyPayment: number;
  totalInstallments: number;
  startDate: Date;
  paymentDay?: number;
  groupNumber?: string;
  quotaNumber?: string;
  contractNumber?: string;
  notes?: string;
}

interface CreateConsortiumUseCaseResponse {
  consortium: ConsortiumDTO;
  payments: ConsortiumPaymentDTO[];
}

export class CreateConsortiumUseCase {
  constructor(
    private consortiaRepository: ConsortiaRepository,
    private consortiumPaymentsRepository: ConsortiumPaymentsRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private costCentersRepository: CostCentersRepository,
  ) {}

  async execute(
    request: CreateConsortiumUseCaseRequest,
  ): Promise<CreateConsortiumUseCaseResponse> {
    const {
      tenantId,
      bankAccountId,
      costCenterId,
      name,
      administrator,
      creditValue,
      monthlyPayment,
      totalInstallments,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Consortium name is required');
    }

    if (!administrator || administrator.trim().length === 0) {
      throw new BadRequestError('Consortium administrator is required');
    }

    if (creditValue <= 0) {
      throw new BadRequestError('Credit value must be positive');
    }

    if (monthlyPayment <= 0) {
      throw new BadRequestError('Monthly payment must be positive');
    }

    if (totalInstallments < 1) {
      throw new BadRequestError('Total installments must be at least 1');
    }

    // Validate bank account exists
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );
    if (!bankAccount) {
      throw new BadRequestError('Bank account not found');
    }

    // Validate cost center exists
    const costCenter = await this.costCentersRepository.findById(
      new UniqueEntityID(costCenterId),
      tenantId,
    );
    if (!costCenter) {
      throw new BadRequestError('Cost center not found');
    }

    const consortium = await this.consortiaRepository.create({
      tenantId,
      bankAccountId,
      costCenterId,
      name: name.trim(),
      administrator: administrator.trim(),
      groupNumber: request.groupNumber,
      quotaNumber: request.quotaNumber,
      contractNumber: request.contractNumber,
      creditValue,
      monthlyPayment,
      totalInstallments,
      startDate: request.startDate,
      paymentDay: request.paymentDay,
      notes: request.notes,
    });

    // Generate monthly payments
    const paymentSchemas = [];
    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = new Date(request.startDate);
      dueDate.setUTCMonth(dueDate.getUTCMonth() + i);
      if (request.paymentDay) {
        dueDate.setUTCDate(request.paymentDay);
      }

      paymentSchemas.push({
        consortiumId: consortium.id.toString(),
        installmentNumber: i,
        dueDate,
        expectedAmount: monthlyPayment,
      });
    }

    const payments =
      await this.consortiumPaymentsRepository.createMany(paymentSchemas);

    return {
      consortium: consortiumToDTO(consortium),
      payments: payments.map(consortiumPaymentToDTO),
    };
  }
}
