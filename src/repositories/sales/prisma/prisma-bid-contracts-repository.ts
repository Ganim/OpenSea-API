import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidContract } from '@/entities/sales/bid-contract';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidContractsRepository,
  FindManyBidContractsPaginatedParams,
} from '../bid-contracts-repository';
import type { BidContractStatus as PrismaBidContractStatus } from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): BidContract {
  return BidContract.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      bidId: new UniqueEntityID(data.bidId as string),
      contractNumber: data.contractNumber as string,
      status: data.status as BidContract['status'],
      signedDate: (data.signedDate as Date) ?? undefined,
      startDate: data.startDate as Date,
      endDate: data.endDate as Date,
      totalValue: Number(data.totalValue),
      remainingValue: Number(data.remainingValue),
      customerId: new UniqueEntityID(data.customerId as string),
      renewalCount: data.renewalCount as number,
      maxRenewals: (data.maxRenewals as number) ?? undefined,
      renewalDeadline: (data.renewalDeadline as Date) ?? undefined,
      deliveryAddresses:
        (data.deliveryAddresses as Record<string, unknown>) ?? undefined,
      contractFileId: data.contractFileId
        ? new UniqueEntityID(data.contractFileId as string)
        : undefined,
      notes: (data.notes as string) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidContractsRepository implements BidContractsRepository {
  async create(contract: BidContract): Promise<void> {
    await prisma.bidContract.create({
      data: {
        id: contract.id.toString(),
        tenantId: contract.tenantId.toString(),
        bidId: contract.bidId.toString(),
        contractNumber: contract.contractNumber,
        status: contract.status as PrismaBidContractStatus,
        signedDate: contract.signedDate,
        startDate: contract.startDate,
        endDate: contract.endDate,
        totalValue: new Prisma.Decimal(contract.totalValue),
        remainingValue: new Prisma.Decimal(contract.remainingValue),
        customerId: contract.customerId.toString(),
        renewalCount: contract.renewalCount,
        maxRenewals: contract.maxRenewals,
        renewalDeadline: contract.renewalDeadline,
        deliveryAddresses:
          (contract.deliveryAddresses as Prisma.InputJsonValue) ?? undefined,
        contractFileId: contract.contractFileId?.toString(),
        notes: contract.notes,
        createdAt: contract.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidContract | null> {
    const data = await prisma.bidContract.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });
    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findByNumber(
    contractNumber: string,
    tenantId: string,
  ): Promise<BidContract | null> {
    const data = await prisma.bidContract.findFirst({
      where: { contractNumber, tenantId, deletedAt: null },
    });
    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyBidContractsPaginatedParams,
  ): Promise<PaginatedResult<BidContract>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };
    if (params.status) where.status = params.status;
    if (params.bidId) where.bidId = params.bidId;

    const [data, total] = await Promise.all([
      prisma.bidContract.findMany({
        where: where as Prisma.BidContractWhereInput,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bidContract.count({
        where: where as Prisma.BidContractWhereInput,
      }),
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

  async save(contract: BidContract): Promise<void> {
    await prisma.bidContract.update({
      where: { id: contract.id.toString() },
      data: {
        status: contract.status as PrismaBidContractStatus,
        remainingValue: new Prisma.Decimal(contract.remainingValue),
        notes: contract.notes,
        deletedAt: contract.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.bidContract.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
