import type { LandingPage } from '@/entities/sales/landing-page';

export interface LandingPageDTO {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description?: string;
  template: string;
  content: Record<string, unknown>;
  formId?: string;
  status: string;
  isPublished: boolean;
  publishedAt?: Date;
  viewCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function landingPageToDTO(landingPage: LandingPage): LandingPageDTO {
  const dto: LandingPageDTO = {
    id: landingPage.id.toString(),
    tenantId: landingPage.tenantId.toString(),
    title: landingPage.title,
    slug: landingPage.slug,
    description: landingPage.description,
    template: landingPage.template,
    content: landingPage.content,
    status: landingPage.status,
    isPublished: landingPage.isPublished,
    viewCount: landingPage.viewCount,
    createdBy: landingPage.createdBy,
    createdAt: landingPage.createdAt,
  };

  if (landingPage.formId) dto.formId = landingPage.formId;
  if (landingPage.publishedAt) dto.publishedAt = landingPage.publishedAt;
  if (landingPage.updatedAt) dto.updatedAt = landingPage.updatedAt;

  return dto;
}
