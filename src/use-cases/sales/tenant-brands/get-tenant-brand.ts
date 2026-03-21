import type { TenantBrand } from '@/entities/sales/tenant-brand';
import { TenantBrand as TenantBrandEntity } from '@/entities/sales/tenant-brand';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantBrandsRepository } from '@/repositories/sales/tenant-brands-repository';

interface GetTenantBrandUseCaseRequest {
  tenantId: string;
}

interface GetTenantBrandUseCaseResponse {
  brand: TenantBrand;
}

export class GetTenantBrandUseCase {
  constructor(private tenantBrandsRepository: TenantBrandsRepository) {}

  async execute(
    request: GetTenantBrandUseCaseRequest,
  ): Promise<GetTenantBrandUseCaseResponse> {
    let brand = await this.tenantBrandsRepository.findByTenant(
      request.tenantId,
    );

    if (!brand) {
      // Create default brand for tenant
      brand = TenantBrandEntity.create({
        tenantId: new UniqueEntityID(request.tenantId),
      });
      await this.tenantBrandsRepository.create(brand);
    }

    return { brand };
  }
}
