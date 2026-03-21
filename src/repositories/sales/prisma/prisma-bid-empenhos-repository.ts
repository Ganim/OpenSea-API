import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidEmpenho } from '@/entities/sales/bid-empenho';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidEmpenhosRepository,
  FindManyBidEmpenhosPaginatedParams,
} from '../bid-empenhos-repository';
import type { BidEmpenhoType as PrismaBidEmpenhoType, BidEmpenhoStatus as PrismaBidEmpenhoStatus } from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): BidEmpenho {
  return BidEmpenho.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      contractId: new UniqueEntityID(data.contractId as string),
      empenhoNumber: data.empenhoNumber as string,
      type: data.type as BidEmpenho['type'],
      value: Number(data.value),
      issueDate: data.issueDate as Date,
      status: data.status as BidEmpenho['status'],
      orderId: data.orderId ? new UniqueEntityID(data.orderId as string) : undefined,
      notes: (data.notes as string) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidEmpenhosRepository implements BidEmpenhosRepository {
  async create(empenho: BidEmpenho): Promise<void> {
    await prisma.bidEmpenho.create({
      data: {
        id: empenho.id.toString(),
        tenantId: empenho.tenantId.toString(),
        contractId: empenho.contractId.toString(),
        empenhoNumber: empenho.empenhoNumber,
        type: empenho.type as PrismaBidEmpenhoType,
        value: new Prisma.Decimal(empenho.value),
        issueDate: empenho.issueDate,
        status: empenho.status as PrismaBidEmpenhoStatus,
        orderId: empenho.orderId?.toString(),
        notes: empenho.notes,
        createdAt: empenho.createdAt,
      },
    });
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<BidEmpenho | null> {
    const data = await prisma.bidEmpenho.findFirst({
      where: { id: id.toString(), tenantId },
    });
    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findByNumber(empenhoNumber: string, tenantId: string): Promise<BidEmpenho | null> {
    const data = await prisma.bidEmpenho.findFirst({
      where: { empenhoNumber, tenantId },
    });
    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyByContractId(params: FindManyBidEmpenhosPaginatedParams): Promise<PaginatedResult<BidEmpenho>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      contractId: params.contractId,
    };
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      prisma.bidEmpenho.findMany({
        where: where as Prisma.BidEmpenhoWhereInput,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bidEmpenho.count({ where: where as Prisma.BidEmpenhoWhereInput }),
    ]);

    return {
      data: data.map((d) => mapToDomain(d as unknown as Record<string, unknown>)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(empenho: BidEmpenho): Promise<void> {
    await prisma.bidEmpenho.update({
      where: { id: empenho.id.toString() },
      data: {
        status: empenho.status as PrismaBidEmpenhoStatus,
        orderId: empenho.orderId?.toString() ?? null,
        notes: empenho.notes,
      },
    });
  }
}
