import type { Tenant, TenantStatus } from '@/entities/core/tenant';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreateTenantSchema {
  name: string;
  slug: string;
  logoUrl?: string | null;
  status?: TenantStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateTenantSchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  status?: TenantStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface TenantsListFilters {
  search?: string;
  status?: string;
}

export interface TenantsRepository {
  create(data: CreateTenantSchema): Promise<Tenant>;
  update(data: UpdateTenantSchema): Promise<Tenant | null>;
  delete(id: UniqueEntityID): Promise<void>;
  findById(id: UniqueEntityID): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findMany(
    page: number,
    perPage: number,
    filters?: TenantsListFilters,
  ): Promise<Tenant[]>;
  countAll(filters?: TenantsListFilters): Promise<number>;

  // Dashboard analytics
  countByStatus(): Promise<Record<string, number>>;
  countMonthlyGrowth(
    months: number,
  ): Promise<Array<{ month: string; count: number }>>;
  countTenantsByPlanTier(): Promise<Record<string, number>>;
  countTotalUsers(): Promise<number>;
  calculateMrr(): Promise<number>;
}
