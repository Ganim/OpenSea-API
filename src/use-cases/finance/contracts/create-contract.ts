import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type ContractDTO,
  contractToDTO,
} from '@/mappers/finance/contract/contract-to-dto';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { GenerateContractEntriesUseCase } from './generate-contract-entries';

interface CreateContractUseCaseRequest {
  tenantId: string;
  title: string;
  description?: string;
  companyId?: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  totalValue: number;
  paymentFrequency: string;
  paymentAmount: number;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew?: boolean;
  renewalPeriodMonths?: number;
  alertDaysBefore?: number;
  notes?: string;
  createdBy?: string;
}

interface CreateContractUseCaseResponse {
  contract: ContractDTO;
  entriesGenerated: number;
}

export class CreateContractUseCase {
  constructor(
    private contractsRepository: ContractsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: CreateContractUseCaseRequest,
  ): Promise<CreateContractUseCaseResponse> {
    const { tenantId, title, startDate, endDate, totalValue, paymentAmount } =
      request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Contract title is required');
    }

    if (totalValue <= 0) {
      throw new BadRequestError('Total value must be positive');
    }

    if (paymentAmount <= 0) {
      throw new BadRequestError('Payment amount must be positive');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    if (!request.companyName || request.companyName.trim().length === 0) {
      throw new BadRequestError('Company name is required');
    }

    // Generate contract code
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `CTR-${timestamp}${random}`;

    const contract = await this.contractsRepository.create({
      tenantId,
      code,
      title: title.trim(),
      description: request.description,
      companyId: request.companyId,
      companyName: request.companyName.trim(),
      contactName: request.contactName,
      contactEmail: request.contactEmail,
      totalValue,
      paymentFrequency: request.paymentFrequency,
      paymentAmount,
      categoryId: request.categoryId,
      costCenterId: request.costCenterId,
      bankAccountId: request.bankAccountId,
      startDate,
      endDate,
      autoRenew: request.autoRenew ?? false,
      renewalPeriodMonths: request.renewalPeriodMonths,
      alertDaysBefore: request.alertDaysBefore ?? 30,
      notes: request.notes,
      createdBy: request.createdBy,
    });

    // Generate entries
    let entriesGenerated = 0;
    if (request.categoryId) {
      const generateEntries = new GenerateContractEntriesUseCase(
        this.contractsRepository,
        this.financeEntriesRepository,
      );
      const result = await generateEntries.execute({
        tenantId,
        contractId: contract.id.toString(),
      });
      entriesGenerated = result.entriesCreated;
    }

    return {
      contract: contractToDTO(contract),
      entriesGenerated,
    };
  }
}
