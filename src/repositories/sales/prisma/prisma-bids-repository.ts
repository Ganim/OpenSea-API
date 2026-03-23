import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bid } from '@/entities/sales/bid';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidsRepository,
  FindManyBidsPaginatedParams,
} from '../bids-repository';
import type {
  BidModality as PrismaBidModality,
  BidCriterion as PrismaBidCriterion,
  BidLegalFramework as PrismaBidLegalFramework,
  BidExecutionRegime as PrismaBidExecutionRegime,
  BidStatus as PrismaBidStatus,
} from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): Bid {
  return Bid.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      portalName: data.portalName as string,
      portalEditalId: (data.portalEditalId as string) ?? undefined,
      editalNumber: data.editalNumber as string,
      modality: data.modality as string as Bid['modality'],
      criterionType: data.criterionType as string as Bid['criterionType'],
      legalFramework: data.legalFramework as string as Bid['legalFramework'],
      executionRegime:
        (data.executionRegime as string as Bid['executionRegime']) ?? undefined,
      object: data.object as string,
      objectSummary: (data.objectSummary as string) ?? undefined,
      organName: data.organName as string,
      organCnpj: (data.organCnpj as string) ?? undefined,
      organState: (data.organState as string) ?? undefined,
      organCity: (data.organCity as string) ?? undefined,
      estimatedValue: data.estimatedValue
        ? Number(data.estimatedValue)
        : undefined,
      ourProposalValue: data.ourProposalValue
        ? Number(data.ourProposalValue)
        : undefined,
      finalValue: data.finalValue ? Number(data.finalValue) : undefined,
      margin: data.margin ? Number(data.margin) : undefined,
      publicationDate: (data.publicationDate as Date) ?? undefined,
      openingDate: data.openingDate as Date,
      closingDate: (data.closingDate as Date) ?? undefined,
      disputeDate: (data.disputeDate as Date) ?? undefined,
      status: data.status as string as Bid['status'],
      viabilityScore: (data.viabilityScore as number) ?? undefined,
      viabilityReason: (data.viabilityReason as string) ?? undefined,
      customerId: data.customerId
        ? new UniqueEntityID(data.customerId as string)
        : undefined,
      assignedToUserId: data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId as string)
        : undefined,
      exclusiveMeEpp: data.exclusiveMeEpp as boolean,
      deliveryStates: Array.isArray(data.deliveryStates)
        ? (data.deliveryStates as string[])
        : [],
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      notes: (data.notes as string) ?? undefined,
      editalUrl: (data.editalUrl as string) ?? undefined,
      editalFileId: data.editalFileId
        ? new UniqueEntityID(data.editalFileId as string)
        : undefined,
      etpFileId: data.etpFileId
        ? new UniqueEntityID(data.etpFileId as string)
        : undefined,
      trFileId: data.trFileId
        ? new UniqueEntityID(data.trFileId as string)
        : undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidsRepository implements BidsRepository {
  async create(bid: Bid): Promise<void> {
    await prisma.bid.create({
      data: {
        id: bid.id.toString(),
        tenantId: bid.tenantId.toString(),
        portalName: bid.portalName,
        portalEditalId: bid.portalEditalId,
        editalNumber: bid.editalNumber,
        modality: bid.modality as PrismaBidModality,
        criterionType: bid.criterionType as PrismaBidCriterion,
        legalFramework: bid.legalFramework as PrismaBidLegalFramework,
        executionRegime: bid.executionRegime as
          | PrismaBidExecutionRegime
          | undefined,
        object: bid.object,
        objectSummary: bid.objectSummary,
        organName: bid.organName,
        organCnpj: bid.organCnpj,
        organState: bid.organState,
        organCity: bid.organCity,
        estimatedValue:
          bid.estimatedValue != null
            ? new Prisma.Decimal(bid.estimatedValue)
            : undefined,
        ourProposalValue:
          bid.ourProposalValue != null
            ? new Prisma.Decimal(bid.ourProposalValue)
            : undefined,
        finalValue:
          bid.finalValue != null
            ? new Prisma.Decimal(bid.finalValue)
            : undefined,
        margin: bid.margin != null ? new Prisma.Decimal(bid.margin) : undefined,
        publicationDate: bid.publicationDate,
        openingDate: bid.openingDate,
        closingDate: bid.closingDate,
        disputeDate: bid.disputeDate,
        status: bid.status as PrismaBidStatus,
        viabilityScore: bid.viabilityScore,
        viabilityReason: bid.viabilityReason,
        customerId: bid.customerId?.toString(),
        assignedToUserId: bid.assignedToUserId?.toString(),
        exclusiveMeEpp: bid.exclusiveMeEpp,
        deliveryStates: bid.deliveryStates,
        tags: bid.tags,
        notes: bid.notes,
        editalUrl: bid.editalUrl,
        editalFileId: bid.editalFileId?.toString(),
        etpFileId: bid.etpFileId?.toString(),
        trFileId: bid.trFileId?.toString(),
        createdAt: bid.createdAt,
      },
    });
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Bid | null> {
    const data = await prisma.bid.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyBidsPaginatedParams,
  ): Promise<PaginatedResult<Bid>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.status) where.status = params.status;
    if (params.modality) where.modality = params.modality;
    if (params.organState) where.organState = params.organState;
    if (params.assignedToUserId)
      where.assignedToUserId = params.assignedToUserId;

    if (params.search) {
      where.OR = [
        { editalNumber: { contains: params.search, mode: 'insensitive' } },
        { object: { contains: params.search, mode: 'insensitive' } },
        { organName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.bid.findMany({
        where: where as Prisma.BidWhereInput,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bid.count({ where: where as Prisma.BidWhereInput }),
    ]);

    return {
      data: data.map((d) =>
        mapToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(bid: Bid): Promise<void> {
    await prisma.bid.update({
      where: { id: bid.id.toString() },
      data: {
        portalName: bid.portalName,
        editalNumber: bid.editalNumber,
        modality: bid.modality as PrismaBidModality,
        criterionType: bid.criterionType as PrismaBidCriterion,
        legalFramework: bid.legalFramework as PrismaBidLegalFramework,
        executionRegime: bid.executionRegime as
          | PrismaBidExecutionRegime
          | undefined,
        object: bid.object,
        objectSummary: bid.objectSummary,
        organName: bid.organName,
        organCnpj: bid.organCnpj,
        organState: bid.organState,
        organCity: bid.organCity,
        estimatedValue:
          bid.estimatedValue != null
            ? new Prisma.Decimal(bid.estimatedValue)
            : null,
        ourProposalValue:
          bid.ourProposalValue != null
            ? new Prisma.Decimal(bid.ourProposalValue)
            : null,
        finalValue:
          bid.finalValue != null ? new Prisma.Decimal(bid.finalValue) : null,
        margin: bid.margin != null ? new Prisma.Decimal(bid.margin) : null,
        publicationDate: bid.publicationDate,
        openingDate: bid.openingDate,
        closingDate: bid.closingDate,
        disputeDate: bid.disputeDate,
        status: bid.status as PrismaBidStatus,
        viabilityScore: bid.viabilityScore,
        viabilityReason: bid.viabilityReason,
        customerId: bid.customerId?.toString() ?? null,
        assignedToUserId: bid.assignedToUserId?.toString() ?? null,
        exclusiveMeEpp: bid.exclusiveMeEpp,
        deliveryStates: bid.deliveryStates,
        tags: bid.tags,
        notes: bid.notes,
        editalUrl: bid.editalUrl,
        editalFileId: bid.editalFileId?.toString() ?? null,
        etpFileId: bid.etpFileId?.toString() ?? null,
        trFileId: bid.trFileId?.toString() ?? null,
        deletedAt: bid.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.bid.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
