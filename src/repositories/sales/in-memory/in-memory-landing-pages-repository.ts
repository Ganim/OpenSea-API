import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import type {
  CreateLandingPageSchema,
  LandingPagesRepository,
} from '../landing-pages-repository';

export class InMemoryLandingPagesRepository implements LandingPagesRepository {
  public items: LandingPage[] = [];
  public tenantSlugs: Map<string, string> = new Map(); // tenantId -> tenantSlug

  async create(data: CreateLandingPageSchema): Promise<LandingPage> {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      slug: data.slug,
      description: data.description,
      template: data.template,
      content: data.content,
      formId: data.formId,
      createdBy: data.createdBy,
    });

    this.items.push(landingPage);
    return landingPage;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LandingPage | null> {
    const landingPage = this.items.find(
      (lp) =>
        !lp.deletedAt &&
        lp.id.equals(id) &&
        lp.tenantId.toString() === tenantId,
    );
    return landingPage ?? null;
  }

  async findBySlug(
    slug: string,
    tenantId: string,
  ): Promise<LandingPage | null> {
    const landingPage = this.items.find(
      (lp) =>
        !lp.deletedAt &&
        lp.slug === slug &&
        lp.tenantId.toString() === tenantId,
    );
    return landingPage ?? null;
  }

  async findByTenantSlugAndPageSlug(
    tenantSlug: string,
    pageSlug: string,
  ): Promise<LandingPage | null> {
    // Find tenantId by tenant slug
    let tenantId: string | undefined;
    for (const [tId, tSlug] of this.tenantSlugs.entries()) {
      if (tSlug === tenantSlug) {
        tenantId = tId;
        break;
      }
    }

    if (!tenantId) return null;

    const landingPage = this.items.find(
      (lp) =>
        !lp.deletedAt &&
        lp.slug === pageSlug &&
        lp.tenantId.toString() === tenantId &&
        lp.isPublished,
    );
    return landingPage ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<LandingPage[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (lp) =>
          !lp.deletedAt &&
          lp.tenantId.toString() === tenantId &&
          (!status || lp.status === status),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return this.items.filter(
      (lp) =>
        !lp.deletedAt &&
        lp.tenantId.toString() === tenantId &&
        (!status || lp.status === status),
    ).length;
  }

  async save(landingPage: LandingPage): Promise<void> {
    const index = this.items.findIndex((lp) => lp.id.equals(landingPage.id));

    if (index >= 0) {
      this.items[index] = landingPage;
    } else {
      this.items.push(landingPage);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const landingPage = this.items.find(
      (lp) => !lp.deletedAt && lp.id.equals(id),
    );

    if (landingPage) {
      landingPage.delete();
    }
  }
}
