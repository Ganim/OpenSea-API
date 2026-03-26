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
import type { CampaignType } from '@prisma/generated/client.js';

// Helper to map a Prisma Campaign record to the domain entity.
// The domain entity has fields (discountValue, applicableTo, currentUsageTotal)
// that don't exist on the current Prisma model, so we provide safe defaults.
function mapToDomain(record: Record<string, unknown>): Campaign {
  return Campaign.create(
    {
      tenantId: new EntityID(record.tenantId as string),
      name: record.name as string,
      description: (record.description as string) ?? undefined,
      type: record.type as Campaign['type'],
      status: record.status as Campaign['status'],
      discountValue: 0,
      applicableTo: 'ALL' as Campaign['applicableTo'],
      currentUsageTotal: (record.usageCount as number) ?? 0,
      priority: (record.priority as number) ?? 0,
      isStackable: (record.stackable as boolean) ?? false,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date,
    },
    new EntityID(record.id as string),
  );
}

export class PrismaCampaignsRepository implements CampaignsRepository {
  async create(data: CreateCampaignSchema): Promise<Campaign> {
    const record = await prisma.campaign.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        type: data.type as CampaignType,
        status: 'DRAFT',
        startDate: data.startDate ?? new Date(),
        endDate: data.endDate ?? new Date(),
        maxUsageTotal: data.maxUsageTotal ?? null,
        maxUsagePerCustomer: data.maxUsagePerCustomer ?? null,
        priority: data.priority ?? 0,
        stackable: data.isStackable ?? false,
        createdByUserId: data.createdByUserId,
      },
    });

    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Campaign | null> {
    const record = await prisma.campaign.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!record) return null;
    return mapToDomain(record as unknown as Record<string, unknown>);
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
      mapToDomain(r as unknown as Record<string, unknown>),
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
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async update(data: UpdateCampaignSchema): Promise<Campaign | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;

    const record = await prisma.campaign.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.campaign.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async incrementUsage(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.campaign.update({
      where: { id: id.toString() },
      data: { usageCount: { increment: 1 } },
    });
  }
}
