import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { GeneratedContent } from '@/entities/sales/generated-content';

export function generatedContentPrismaToDomain(
  data: Record<string, unknown>,
): GeneratedContent {
  return GeneratedContent.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
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
    new UniqueEntityID(data.id as string),
  );
}
