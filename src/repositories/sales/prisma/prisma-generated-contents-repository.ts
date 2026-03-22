import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { GeneratedContent } from '@/entities/sales/generated-content';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  GeneratedContentsRepository,
  FindManyGeneratedContentsParams,
} from '../generated-contents-repository';
import type {
  GeneratedContentType as PrismaGeneratedContentType,
  ContentStatus as PrismaContentStatus,
  ContentChannel as PrismaContentChannel,
} from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): GeneratedContent {
  return GeneratedContent.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      type: data.type as string,
      channel: (data.channel as string) ?? undefined,
      status: data.status as string,
      title: (data.title as string) ?? undefined,
      caption: (data.caption as string) ?? undefined,
      hashtags: (data.hashtags as string[]) ?? [],
      templateId: (data.templateId as string) ?? undefined,
      brandId: (data.brandId as string) ?? undefined,
      fileId: (data.fileId as string) ?? undefined,
      thumbnailFileId: (data.thumbnailFileId as string) ?? undefined,
      variantIds: (data.variantIds as string[]) ?? [],
      campaignId: (data.campaignId as string) ?? undefined,
      catalogId: (data.catalogId as string) ?? undefined,
      aiGenerated: data.aiGenerated as boolean,
      aiPrompt: (data.aiPrompt as string) ?? undefined,
      aiModel: (data.aiModel as string) ?? undefined,
      publishedAt: (data.publishedAt as Date) ?? undefined,
      publishedTo: (data.publishedTo as string) ?? undefined,
      scheduledAt: (data.scheduledAt as Date) ?? undefined,
      approvedByUserId: (data.approvedByUserId as string) ?? undefined,
      approvedAt: (data.approvedAt as Date) ?? undefined,
      views: data.views as number,
      clicks: data.clicks as number,
      shares: data.shares as number,
      engagement: data.engagement ? Number(data.engagement) : undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaGeneratedContentsRepository
  implements GeneratedContentsRepository
{
  async create(content: GeneratedContent): Promise<void> {
    await prisma.generatedContent.create({
      data: {
        id: content.id.toString(),
        tenantId: content.tenantId.toString(),
        type: content.type as PrismaGeneratedContentType,
        channel: content.channel as PrismaContentChannel | undefined,
        status: content.status as PrismaContentStatus,
        title: content.title,
        caption: content.caption,
        hashtags: content.hashtags,
        templateId: content.templateId,
        brandId: content.brandId,
        fileId: content.fileId,
        thumbnailFileId: content.thumbnailFileId,
        variantIds: content.variantIds,
        campaignId: content.campaignId,
        catalogId: content.catalogId,
        aiGenerated: content.aiGenerated,
        aiPrompt: content.aiPrompt,
        aiModel: content.aiModel,
        createdAt: content.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedContent | null> {
    const data = await prisma.generatedContent.findFirst({
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
    params: FindManyGeneratedContentsParams,
  ): Promise<PaginatedResult<GeneratedContent>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { caption: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.productId) {
      where.variantIds = { has: params.productId };
    }

    if (params.catalogId) {
      where.catalogId = params.catalogId;
    }

    const [items, total] = await Promise.all([
      prisma.generatedContent.findMany({
        where,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.generatedContent.count({ where }),
    ]);

    return {
      data: items.map((d) =>
        mapToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(content: GeneratedContent): Promise<void> {
    await prisma.generatedContent.update({
      where: { id: content.id.toString() },
      data: {
        status: content.status as PrismaContentStatus,
        title: content.title,
        caption: content.caption,
        approvedByUserId: content.approvedByUserId,
        approvedAt: content.approvedAt,
        deletedAt: content.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.generatedContent.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
