import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantBrand } from '@/entities/sales/tenant-brand';

export interface TenantBrandsRepository {
  create(brand: TenantBrand): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<TenantBrand | null>;
  findByTenant(tenantId: string): Promise<TenantBrand | null>;
  save(brand: TenantBrand): Promise<void>;
}
