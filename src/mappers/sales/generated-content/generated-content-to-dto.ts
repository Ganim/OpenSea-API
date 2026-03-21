import type { GeneratedContent } from '@/entities/sales/generated-content';

export interface GeneratedContentDTO {
  id: string;
  tenantId: string;
  type: string;
  channel: string | null;
  status: string;
  title: string | null;
  caption: string | null;
  hashtags: string[];
  templateId: string | null;
  brandId: string | null;
  fileId: string | null;
  thumbnailFileId: string | null;
  variantIds: string[];
  campaignId: string | null;
  catalogId: string | null;
  aiGenerated: boolean;
  aiPrompt: string | null;
  aiModel: string | null;
  publishedAt: Date | null;
  publishedTo: string | null;
  scheduledAt: Date | null;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  views: number;
  clicks: number;
  shares: number;
  engagement: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function generatedContentToDTO(
  content: GeneratedContent,
): GeneratedContentDTO {
  return {
    id: content.id.toString(),
    tenantId: content.tenantId.toString(),
    type: content.type,
    channel: content.channel ?? null,
    status: content.status,
    title: content.title ?? null,
    caption: content.caption ?? null,
    hashtags: content.hashtags,
    templateId: content.templateId ?? null,
    brandId: content.brandId ?? null,
    fileId: content.fileId ?? null,
    thumbnailFileId: content.thumbnailFileId ?? null,
    variantIds: content.variantIds,
    campaignId: content.campaignId ?? null,
    catalogId: content.catalogId ?? null,
    aiGenerated: content.aiGenerated,
    aiPrompt: content.aiPrompt ?? null,
    aiModel: content.aiModel ?? null,
    publishedAt: content.publishedAt ?? null,
    publishedTo: content.publishedTo ?? null,
    scheduledAt: content.scheduledAt ?? null,
    approvedByUserId: content.approvedByUserId ?? null,
    approvedAt: content.approvedAt ?? null,
    views: content.views,
    clicks: content.clicks,
    shares: content.shares,
    engagement: content.engagement ?? null,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt ?? null,
  };
}
