import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import { prisma } from '@/lib/prisma';
import { dealPrismaToDomain } from '@/mappers/sales/deal/deal-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  DealsRepository,
  FindManyDealsPaginatedParams,
} from '../deals-repository';
import type { DealStatus, DealPriority } from '@prisma/generated/client.js';

export class PrismaDealsRepository implements DealsRepository {
  async create(deal: Deal): Promise<void> {
    await prisma.crmDeal.create({
      data: {
        id: deal.id.toString(),
        tenantId: deal.tenantId.toString(),
        title: deal.title,
        customerId: deal.customerId.toString(),
        contactId: deal.contactId?.toString() ?? null,
        pipelineId: deal.pipelineId.toString(),
        stageId: deal.stageId.toString(),
        status: deal.status as DealStatus,
        priority: deal.priority as DealPriority,
        value: deal.value ?? null,
        currency: deal.currency,
        expectedCloseDate: deal.expectedCloseDate ?? null,
        closedAt: deal.closedAt ?? null,
        lostReason: deal.lostReason ?? null,
        source: deal.source ?? null,
        tags: deal.tags,
        customFields: (deal.customFields ?? undefined) as never,
        position: deal.position,
        assignedToUserId: deal.assignedToUserId?.toString() ?? null,
        createdAt: deal.createdAt,
      },
    });
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Deal | null> {
    const data = await prisma.crmDeal.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return dealPrismaToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyDealsPaginatedParams,
  ): Promise<PaginatedResult<Deal>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.pipelineId) {
      where.pipelineId = params.pipelineId;
    }
    if (params.stageId) {
      where.stageId = params.stageId;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.priority) {
      where.priority = params.priority;
    }
    if (params.customerId) {
      where.customerId = params.customerId;
    }
    if (params.assignedToUserId) {
      where.assignedToUserId = params.assignedToUserId;
    }
    if (params.search) {
      where.title = { contains: params.search, mode: 'insensitive' };
    }

    const [dealsData, total] = await Promise.all([
      prisma.crmDeal.findMany({
        where: where as never,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      prisma.crmDeal.count({
        where: where as never,
      }),
    ]);

    return {
      data: dealsData.map((d) =>
        dealPrismaToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByStage(stageId: string, tenantId: string): Promise<Deal[]> {
    const items = await prisma.crmDeal.findMany({
      where: {
        stageId,
        tenantId,
        deletedAt: null,
      },
      orderBy: { position: 'asc' },
    });

    return items.map((d) =>
      dealPrismaToDomain(d as unknown as Record<string, unknown>),
    );
  }

  async save(deal: Deal): Promise<void> {
    await prisma.crmDeal.update({
      where: { id: deal.id.toString() },
      data: {
        title: deal.title,
        contactId: deal.contactId?.toString() ?? null,
        stageId: deal.stageId.toString(),
        status: deal.status as DealStatus,
        priority: deal.priority as DealPriority,
        value: deal.value ?? null,
        expectedCloseDate: deal.expectedCloseDate ?? null,
        closedAt: deal.closedAt ?? null,
        lostReason: deal.lostReason ?? null,
        tags: deal.tags,
        customFields: (deal.customFields ?? undefined) as never,
        position: deal.position,
        assignedToUserId: deal.assignedToUserId?.toString() ?? null,
        deletedAt: deal.deletedAt ?? null,
      },
    });
  }

  async changeStage(
    id: UniqueEntityID,
    _tenantId: string,
    stageId: UniqueEntityID,
  ): Promise<void> {
    await prisma.crmDeal.update({
      where: { id: id.toString() },
      data: {
        stageId: stageId.toString(),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.crmDeal.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
