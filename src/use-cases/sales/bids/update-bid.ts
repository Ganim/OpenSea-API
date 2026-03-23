import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bid, BidStatusType } from '@/entities/sales/bid';
import type { BidsRepository } from '@/repositories/sales/bids-repository';
import type { BidHistoryRepository } from '@/repositories/sales/bid-history-repository';
import { BidHistory } from '@/entities/sales/bid-history';

interface UpdateBidUseCaseRequest {
  id: string;
  tenantId: string;
  userId?: string;
  object?: string;
  objectSummary?: string;
  status?: string;
  viabilityScore?: number;
  viabilityReason?: string;
  ourProposalValue?: number;
  finalValue?: number;
  margin?: number;
  customerId?: string | null;
  assignedToUserId?: string | null;
  tags?: string[];
  notes?: string;
}

interface UpdateBidUseCaseResponse {
  bid: Bid;
}

export class UpdateBidUseCase {
  constructor(
    private bidsRepository: BidsRepository,
    private bidHistoryRepository: BidHistoryRepository,
  ) {}

  async execute(
    request: UpdateBidUseCaseRequest,
  ): Promise<UpdateBidUseCaseResponse> {
    const bid = await this.bidsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!bid) {
      throw new ResourceNotFoundError('Bid not found');
    }

    const oldStatus = bid.status;

    if (request.object !== undefined) bid.object = request.object;
    if (request.objectSummary !== undefined)
      bid.objectSummary = request.objectSummary;
    if (request.status !== undefined)
      bid.status = request.status as BidStatusType;
    if (request.viabilityScore !== undefined)
      bid.viabilityScore = request.viabilityScore;
    if (request.viabilityReason !== undefined)
      bid.viabilityReason = request.viabilityReason;
    if (request.ourProposalValue !== undefined)
      bid.ourProposalValue = request.ourProposalValue;
    if (request.finalValue !== undefined) bid.finalValue = request.finalValue;
    if (request.margin !== undefined) bid.margin = request.margin;
    if (request.customerId !== undefined) {
      bid.customerId = request.customerId
        ? new UniqueEntityID(request.customerId)
        : undefined;
    }
    if (request.assignedToUserId !== undefined) {
      bid.assignedToUserId = request.assignedToUserId
        ? new UniqueEntityID(request.assignedToUserId)
        : undefined;
    }
    if (request.tags !== undefined) bid.tags = request.tags;
    if (request.notes !== undefined) bid.notes = request.notes;

    await this.bidsRepository.save(bid);

    if (request.status && request.status !== oldStatus) {
      await this.bidHistoryRepository.create(
        BidHistory.create({
          bidId: bid.id,
          tenantId: new UniqueEntityID(request.tenantId),
          action: 'BID_STATUS_CHANGED',
          description: `Status alterado de ${oldStatus} para ${request.status}`,
          metadata: { oldStatus, newStatus: request.status },
          performedByUserId: request.userId
            ? new UniqueEntityID(request.userId)
            : undefined,
        }),
      );
    }

    return { bid };
  }
}
