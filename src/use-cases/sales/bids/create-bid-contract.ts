import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidContract } from '@/entities/sales/bid-contract';
import type { BidsRepository } from '@/repositories/sales/bids-repository';
import type { BidContractsRepository } from '@/repositories/sales/bid-contracts-repository';
import type { BidHistoryRepository } from '@/repositories/sales/bid-history-repository';
import { BidHistory } from '@/entities/sales/bid-history';

interface CreateBidContractUseCaseRequest {
  tenantId: string;
  bidId: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  totalValue: number;
  customerId: string;
  signedDate?: Date;
  maxRenewals?: number;
  renewalDeadline?: Date;
  deliveryAddresses?: Record<string, unknown>;
  notes?: string;
  userId?: string;
}

interface CreateBidContractUseCaseResponse {
  contract: BidContract;
}

export class CreateBidContractUseCase {
  constructor(
    private bidsRepository: BidsRepository,
    private bidContractsRepository: BidContractsRepository,
    private bidHistoryRepository: BidHistoryRepository,
  ) {}

  async execute(
    request: CreateBidContractUseCaseRequest,
  ): Promise<CreateBidContractUseCaseResponse> {
    const bid = await this.bidsRepository.findById(
      new UniqueEntityID(request.bidId),
      request.tenantId,
    );

    if (!bid) {
      throw new ResourceNotFoundError('Bid not found');
    }

    if (!request.contractNumber || request.contractNumber.trim().length === 0) {
      throw new BadRequestError('Contract number is required');
    }

    const existing = await this.bidContractsRepository.findByNumber(
      request.contractNumber,
      request.tenantId,
    );

    if (existing) {
      throw new BadRequestError('Contract number already exists');
    }

    const contract = BidContract.create({
      tenantId: new UniqueEntityID(request.tenantId),
      bidId: new UniqueEntityID(request.bidId),
      contractNumber: request.contractNumber.trim(),
      startDate: request.startDate,
      endDate: request.endDate,
      totalValue: request.totalValue,
      remainingValue: request.totalValue,
      customerId: new UniqueEntityID(request.customerId),
      signedDate: request.signedDate,
      maxRenewals: request.maxRenewals,
      renewalDeadline: request.renewalDeadline,
      deliveryAddresses: request.deliveryAddresses,
      notes: request.notes,
    });

    await this.bidContractsRepository.create(contract);

    // Update bid status to CONTRACTED
    bid.status = 'CONTRACTED';
    await this.bidsRepository.save(bid);

    await this.bidHistoryRepository.create(
      BidHistory.create({
        bidId: bid.id,
        tenantId: new UniqueEntityID(request.tenantId),
        action: 'BID_CONTRACT_CREATED',
        description: `Contrato ${request.contractNumber} criado`,
        metadata: {
          contractId: contract.id.toString(),
          contractNumber: request.contractNumber,
        },
        performedByUserId: request.userId
          ? new UniqueEntityID(request.userId)
          : undefined,
      }),
    );

    return { contract };
  }
}
