import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface GetTenantDetailsUseCaseRequest {
  tenantId: string;
}

interface GetTenantDetailsUseCaseResponse {
  tenant: TenantDTO;
}

export class GetTenantDetailsUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    tenantId,
  }: GetTenantDetailsUseCaseRequest): Promise<GetTenantDetailsUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    return { tenant: tenantToDTO(tenant) };
  }
}
