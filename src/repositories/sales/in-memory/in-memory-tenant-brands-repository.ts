import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantBrand } from '@/entities/sales/tenant-brand';
import type { TenantBrandsRepository } from '@/repositories/sales/tenant-brands-repository';

export class InMemoryTenantBrandsRepository implements TenantBrandsRepository {
  public items: TenantBrand[] = [];

  async create(brand: TenantBrand): Promise<void> {
    this.items.push(brand);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TenantBrand | null> {
    return (
      this.items.find(
        (b) =>
          b.id.toString() === id.toString() &&
          b.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByTenant(tenantId: string): Promise<TenantBrand | null> {
    return (
      this.items.find((b) => b.tenantId.toString() === tenantId) ?? null
    );
  }

  async save(brand: TenantBrand): Promise<void> {
    const index = this.items.findIndex(
      (b) => b.id.toString() === brand.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = brand;
    }
  }
}
