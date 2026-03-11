import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ContractDTO,
  contractToDTO,
} from '@/mappers/finance/contract/contract-to-dto';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';

interface UpdateContractUseCaseRequest {
  tenantId: string;
  contractId: string;
  title?: string;
  description?: string | null;
  companyId?: string | null;
  companyName?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  totalValue?: number;
  paymentFrequency?: string;
  paymentAmount?: number;
  categoryId?: string | null;
  costCenterId?: string | null;
  bankAccountId?: string | null;
  endDate?: Date;
  autoRenew?: boolean;
  renewalPeriodMonths?: number | null;
  alertDaysBefore?: number;
  folderPath?: string | null;
  notes?: string | null;
}

interface UpdateContractUseCaseResponse {
  contract: ContractDTO;
}

export class UpdateContractUseCase {
  constructor(private contractsRepository: ContractsRepository) {}

  async execute(
    request: UpdateContractUseCaseRequest,
  ): Promise<UpdateContractUseCaseResponse> {
    const { tenantId, contractId } = request;

    const existing = await this.contractsRepository.findById(
      new UniqueEntityID(contractId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Contract not found');
    }

    if (existing.isCancelled) {
      throw new BadRequestError('Cannot update a cancelled contract');
    }

    if (request.title !== undefined && request.title.trim().length === 0) {
      throw new BadRequestError('Contract title cannot be empty');
    }

    if (request.totalValue !== undefined && request.totalValue <= 0) {
      throw new BadRequestError('Total value must be positive');
    }

    if (request.paymentAmount !== undefined && request.paymentAmount <= 0) {
      throw new BadRequestError('Payment amount must be positive');
    }

    const contract = await this.contractsRepository.update({
      id: new UniqueEntityID(contractId),
      tenantId,
      title: request.title,
      description: request.description,
      companyId: request.companyId,
      companyName: request.companyName,
      contactName: request.contactName,
      contactEmail: request.contactEmail,
      totalValue: request.totalValue,
      paymentFrequency: request.paymentFrequency,
      paymentAmount: request.paymentAmount,
      categoryId: request.categoryId,
      costCenterId: request.costCenterId,
      bankAccountId: request.bankAccountId,
      endDate: request.endDate,
      autoRenew: request.autoRenew,
      renewalPeriodMonths: request.renewalPeriodMonths,
      alertDaysBefore: request.alertDaysBefore,
      folderPath: request.folderPath,
      notes: request.notes,
    });

    if (!contract) {
      throw new ResourceNotFoundError('Contract not found');
    }

    return {
      contract: contractToDTO(contract),
    };
  }
}
