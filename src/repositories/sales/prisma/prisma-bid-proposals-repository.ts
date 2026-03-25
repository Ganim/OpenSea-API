import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidProposal } from '@/entities/sales/bid-proposal';
import type { BidProposalStatusType } from '@/entities/sales/bid-proposal';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidProposalsRepository,
  FindManyBidProposalsPaginatedParams,
} from '../bid-proposals-repository';
import type { BidProposalStatus as PrismaBidProposalStatus } from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): BidProposal {
  return BidProposal.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      bidId: new UniqueEntityID(data.bidId as string),
      version: data.version as number,
      status: data.status as BidProposalStatusType,
      totalValue: Number(data.totalValue),
      validUntil: (data.validUntil as Date) ?? undefined,
      proposalFileId: data.proposalFileId
        ? new UniqueEntityID(data.proposalFileId as string)
        : undefined,
      sentAt: (data.sentAt as Date) ?? undefined,
      sentByUserId: data.sentByUserId
        ? new UniqueEntityID(data.sentByUserId as string)
        : undefined,
      sentByAi: data.sentByAi as boolean,
      portalConfirmation: (data.portalConfirmation as string) ?? undefined,
      notes: (data.notes as string) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidProposalsRepository implements BidProposalsRepository {
  async create(proposal: BidProposal): Promise<void> {
    await prisma.bidProposal.create({
      data: {
        id: proposal.id.toString(),
        tenantId: proposal.tenantId.toString(),
        bidId: proposal.bidId.toString(),
        version: proposal.version,
        status: proposal.status as PrismaBidProposalStatus,
        totalValue: new Prisma.Decimal(proposal.totalValue),
        validUntil: proposal.validUntil ?? null,
        proposalFileId: proposal.proposalFileId?.toString() ?? null,
        sentAt: proposal.sentAt ?? null,
        sentByUserId: proposal.sentByUserId?.toString() ?? null,
        sentByAi: proposal.sentByAi,
        portalConfirmation: proposal.portalConfirmation ?? null,
        notes: proposal.notes ?? null,
        createdAt: proposal.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidProposal | null> {
    const data = await prisma.bidProposal.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyByBidId(
    params: FindManyBidProposalsPaginatedParams,
  ): Promise<PaginatedResult<BidProposal>> {
    const where: Prisma.BidProposalWhereInput = {
      tenantId: params.tenantId,
      bidId: params.bidId,
    };

    const [proposalsData, total] = await Promise.all([
      prisma.bidProposal.findMany({
        where,
        orderBy: { version: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bidProposal.count({ where }),
    ]);

    return {
      data: proposalsData.map((d) =>
        mapToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(proposal: BidProposal): Promise<void> {
    await prisma.bidProposal.update({
      where: { id: proposal.id.toString() },
      data: {
        status: proposal.status as PrismaBidProposalStatus,
        totalValue: new Prisma.Decimal(proposal.totalValue),
        validUntil: proposal.validUntil ?? null,
        proposalFileId: proposal.proposalFileId?.toString() ?? null,
        sentAt: proposal.sentAt ?? null,
        sentByUserId: proposal.sentByUserId?.toString() ?? null,
        sentByAi: proposal.sentByAi,
        portalConfirmation: proposal.portalConfirmation ?? null,
        notes: proposal.notes ?? null,
      },
    });
  }
}
