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

// Helper to map a Prisma Campaign record to the domain entity.
// The domain entity has fields (discountValue, applicableTo, currentUsageTotal)
// that don't exist on the current Prisma model, so we provide safe defaults.
function mapToDomain(record: any): Campaign {
  return Campaign.create(
    {
      tenantId: new EntityID(record.tenantId),
      name: record.name,
      description: record.description ?? undefined,
      type: record.type as Campaign['type'],
      status: record.status as Campaign['status'],
      discountValue: 0,
      applicableTo: 'ALL' as Campaign['applicableTo'],
      currentUsageTotal: record.usageCount ?? 0,
      priority: record.priority ?? 0,
      isStackable: record.stackable ?? false,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    new EntityID(record.id),
  );
}

export class PrismaCampaignsRepository implements CampaignsRepository {
  async create(data: CreateCampaignSchema): Promise<Campaign> {
    const record = await prisma.campaign.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        type: data.type as any,
        status: 'DRAFT',
        startDate: data.startDate ?? new Date(),
        endDate: data.endDate ?? new Date(),
        maxUsageTotal: data.maxUsageTotal ?? null,
        maxUsagePerCustomer: data.maxUsagePerCustomer ?? null,
        priority: data.priority ?? 0,
        stackable: data.isStackable ?? false,
        createdByUserId: data.tenantId, // placeholder — should come from request context
      },
    });

    return mapToDomain(record);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Campaign | null> {
    const record = await prisma.campaign.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!record) return null;
    return mapToDomain(record);
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

    const data = records.map((r) => mapToDomain(r));

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

    return records.map((r) => mapToDomain(r));
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

    return mapToDomain(record);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.campaign.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.campaign.update({
      where: { id: id.toString() },
      data: { usageCount: { increment: 1 } },
    });
  }
}
