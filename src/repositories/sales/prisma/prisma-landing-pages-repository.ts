import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import { prisma } from '@/lib/prisma';
import type { LandingPageStatus } from '@prisma/generated/client.js';
import type {
  CreateLandingPageSchema,
  LandingPagesRepository,
} from '../landing-pages-repository';

function mapToDomain(data: Record<string, unknown>): LandingPage {
  return LandingPage.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      title: data.title as string,
      slug: data.slug as string,
      description: (data.description as string) ?? undefined,
      template: data.template as string,
      content: (data.content as Record<string, unknown>) ?? {},
      formId: (data.formId as string) ?? undefined,
      status: data.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      isPublished: data.isPublished as boolean,
      publishedAt: (data.publishedAt as Date) ?? undefined,
      viewCount: data.viewCount as number,
      createdBy: data.createdBy as string,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaLandingPagesRepository implements LandingPagesRepository {
  async create(data: CreateLandingPageSchema): Promise<LandingPage> {
    const landingPageData = await prisma.landingPage.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        template: data.template ?? 'lead-capture',
        content: data.content ?? {},
        formId: data.formId,
        createdBy: data.createdBy,
      },
    });

    return mapToDomain(landingPageData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LandingPage | null> {
    const landingPageData = await prisma.landingPage.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!landingPageData) return null;

    return mapToDomain(landingPageData as unknown as Record<string, unknown>);
  }

  async findBySlug(
    slug: string,
    tenantId: string,
  ): Promise<LandingPage | null> {
    const landingPageData = await prisma.landingPage.findFirst({
      where: { slug, tenantId, deletedAt: null },
    });

    if (!landingPageData) return null;

    return mapToDomain(landingPageData as unknown as Record<string, unknown>);
  }

  async findByTenantSlugAndPageSlug(
    tenantSlug: string,
    pageSlug: string,
  ): Promise<LandingPage | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) return null;

    const landingPageData = await prisma.landingPage.findFirst({
      where: {
        slug: pageSlug,
        tenantId: tenant.id,
        isPublished: true,
        deletedAt: null,
      },
    });

    if (!landingPageData) return null;

    return mapToDomain(landingPageData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<LandingPage[]> {
    const landingPagesData = await prisma.landingPage.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status: status as LandingPageStatus }),
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return landingPagesData.map((lp) =>
      mapToDomain(lp as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return prisma.landingPage.count({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status: status as LandingPageStatus }),
      },
    });
  }

  async save(landingPage: LandingPage): Promise<void> {
    await prisma.landingPage.update({
      where: { id: landingPage.id.toString() },
      data: {
        title: landingPage.title,
        slug: landingPage.slug,
        description: landingPage.description,
        template: landingPage.template,
        content: landingPage.content,
        formId: landingPage.formId ?? null,
        status: landingPage.status as LandingPageStatus,
        isPublished: landingPage.isPublished,
        publishedAt: landingPage.publishedAt,
        viewCount: landingPage.viewCount,
        deletedAt: landingPage.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.landingPage.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date() },
    });
  }
}
