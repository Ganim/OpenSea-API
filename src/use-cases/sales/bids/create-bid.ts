import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bid } from '@/entities/sales/bid';
import type {
  BidModality,
  BidCriterion,
  BidLegalFramework,
  BidExecutionRegime,
} from '@/entities/sales/bid';
import type { BidsRepository } from '@/repositories/sales/bids-repository';
import type { BidHistoryRepository } from '@/repositories/sales/bid-history-repository';
import { BidHistory } from '@/entities/sales/bid-history';

interface CreateBidUseCaseRequest {
  tenantId: string;
  portalName: string;
  portalEditalId?: string;
  editalNumber: string;
  modality: string;
  criterionType: string;
  legalFramework: string;
  executionRegime?: string;
  object: string;
  objectSummary?: string;
  organName: string;
  organCnpj?: string;
  organState?: string;
  organCity?: string;
  estimatedValue?: number;
  publicationDate?: Date;
  openingDate: Date;
  closingDate?: Date;
  disputeDate?: Date;
  customerId?: string;
  assignedToUserId?: string;
  exclusiveMeEpp?: boolean;
  deliveryStates?: string[];
  tags?: string[];
  notes?: string;
  editalUrl?: string;
  userId?: string;
}

interface CreateBidUseCaseResponse {
  bid: Bid;
}

export class CreateBidUseCase {
  constructor(
    private bidsRepository: BidsRepository,
    private bidHistoryRepository: BidHistoryRepository,
  ) {}

  async execute(
    request: CreateBidUseCaseRequest,
  ): Promise<CreateBidUseCaseResponse> {
    if (!request.editalNumber || request.editalNumber.trim().length === 0) {
      throw new BadRequestError('Edital number is required');
    }

    if (!request.object || request.object.trim().length === 0) {
      throw new BadRequestError('Object description is required');
    }

    if (!request.organName || request.organName.trim().length === 0) {
      throw new BadRequestError('Organ name is required');
    }

    const bid = Bid.create({
      tenantId: new UniqueEntityID(request.tenantId),
      portalName: request.portalName,
      portalEditalId: request.portalEditalId,
      editalNumber: request.editalNumber.trim(),
      modality: request.modality as BidModality,
      criterionType: request.criterionType as BidCriterion,
      legalFramework: request.legalFramework as BidLegalFramework,
      executionRegime: request.executionRegime as
        | BidExecutionRegime
        | undefined,
      object: request.object.trim(),
      objectSummary: request.objectSummary,
      organName: request.organName.trim(),
      organCnpj: request.organCnpj,
      organState: request.organState,
      organCity: request.organCity,
      estimatedValue: request.estimatedValue,
      publicationDate: request.publicationDate,
      openingDate: request.openingDate,
      closingDate: request.closingDate,
      disputeDate: request.disputeDate,
      customerId: request.customerId
        ? new UniqueEntityID(request.customerId)
        : undefined,
      assignedToUserId: request.assignedToUserId
        ? new UniqueEntityID(request.assignedToUserId)
        : undefined,
      exclusiveMeEpp: request.exclusiveMeEpp,
      deliveryStates: request.deliveryStates,
      tags: request.tags,
      notes: request.notes,
      editalUrl: request.editalUrl,
    });

    await this.bidsRepository.create(bid);

    await this.bidHistoryRepository.create(
      BidHistory.create({
        bidId: bid.id,
        tenantId: new UniqueEntityID(request.tenantId),
        action: 'BID_CREATED',
        description: `Licitação ${request.editalNumber} cadastrada`,
        performedByUserId: request.userId
          ? new UniqueEntityID(request.userId)
          : undefined,
      }),
    );

    return { bid };
  }
}
