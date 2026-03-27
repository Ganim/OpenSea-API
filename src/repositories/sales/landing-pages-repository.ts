import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LandingPage } from '@/entities/sales/landing-page';

export interface CreateLandingPageSchema {
  tenantId: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  content?: Record<string, unknown>;
  formId?: string;
  createdBy: string;
}

export interface LandingPagesRepository {
  create(data: CreateLandingPageSchema): Promise<LandingPage>;
  findById(id: UniqueEntityID, tenantId: string): Promise<LandingPage | null>;
  findBySlug(slug: string, tenantId: string): Promise<LandingPage | null>;
  findByTenantSlugAndPageSlug(
    tenantSlug: string,
    pageSlug: string,
  ): Promise<LandingPage | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<LandingPage[]>;
  countByTenant(tenantId: string, status?: string): Promise<number>;
  save(landingPage: LandingPage): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
