import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Campaign } from '@/entities/sales/campaign';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CampaignsRepository,
  CreateCampaignSchema,
  FindManyCampaignsParams,
  UpdateCampaignSchema,
} from '../campaigns-repository';

export class PrismaCampaignsRepository implements CampaignsRepository {
  async create(data: CreateCampaignSchema): Promise<Campaign> {
    const record = await prisma.campaign.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        status: 'DRAFT',
        discountValue: data.discountValue,
        applicableTo: data.applicableTo,
        minOrderValue: data.minOrderValue ?? null,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        maxUsageTotal: data.maxUsageTotal ?? null,
        maxUsagePerCustomer: data.maxUsagePerCustomer ?? null,
        currentUsageTotal: 0,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        priority: data.priority ?? 0,
        isStackable: data.isStackable ?? false,
      },
    });

    return Campaign.create(
      {
        tenantId: new EntityID(record.tenantId),
        name: record.name,
        description: record.description ?? undefined,
        type: record.type as Campaign['type'],
        status: record.status as Campaign['status'],
        discountValue: Number(record.discountValue),
        applicableTo: record.applicableTo as Campaign['applicableTo'],
        currentUsageTotal: record.currentUsageTotal,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Campaign | null> {
    const record = await prisma.campaign.findUnique({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!record) return null;

    return Campaign.create(
      {
        tenantId: new EntityID(record.tenantId),
        name: record.name,
        description: record.description ?? undefined,
        type: record.type as Campaign['type'],
        status: record.status as Campaign['status'],
        discountValue: Number(record.discountValue),
        applicableTo: record.applicableTo as Campaign['applicableTo'],
        currentUsageTotal: record.currentUsageTotal,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async findManyPaginated(
    params: FindManyCampaignsParams,
  ): Promise<PaginatedResult<Campaign>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
      }),
      prisma.campaign.count({ where }),
    ]);

    const data = records.map((r) =>
      Campaign.create(
        {
          tenantId: new EntityID(r.tenantId),
          name: r.name,
          description: r.description ?? undefined,
          type: r.type as Campaign['type'],
          status: r.status as Campaign['status'],
          discountValue: Number(r.discountValue),
          applicableTo: r.applicableTo as Campaign['applicableTo'],
          currentUsageTotal: r.currentUsageTotal,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        new EntityID(r.id),
      ),
    );

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findActive(tenantId: string): Promise<Campaign[]> {
    const records = await prisma.campaign.findMany({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
    });

    return records.map((r) =>
      Campaign.create(
        {
          tenantId: new EntityID(r.tenantId),
          name: r.name,
          description: r.description ?? undefined,
          type: r.type as Campaign['type'],
          status: r.status as Campaign['status'],
          discountValue: Number(r.discountValue),
          applicableTo: r.applicableTo as Campaign['applicableTo'],
          currentUsageTotal: r.currentUsageTotal,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        new EntityID(r.id),
      ),
    );
  }

  async update(data: UpdateCampaignSchema): Promise<Campaign | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.applicableTo !== undefined) updateData.applicableTo = data.applicableTo;

    const record = await prisma.campaign.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return Campaign.create(
      {
        tenantId: new EntityID(record.tenantId),
        name: record.name,
        description: record.description ?? undefined,
        type: record.type as Campaign['type'],
        status: record.status as Campaign['status'],
        discountValue: Number(record.discountValue),
        applicableTo: record.applicableTo as Campaign['applicableTo'],
        currentUsageTotal: record.currentUsageTotal,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.campaign.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date() },
    });
  }

  async incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.campaign.update({
      where: { id: id.toString(), tenantId },
      data: { currentUsageTotal: { increment: 1 } },
    });
  }
}
