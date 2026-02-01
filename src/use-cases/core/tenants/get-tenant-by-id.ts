import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface GetTenantByIdUseCaseRequest {
  tenantId: string;
}

interface GetTenantByIdUseCaseResponse {
  tenant: TenantDTO;
}

export class GetTenantByIdUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    tenantId,
  }: GetTenantByIdUseCaseRequest): Promise<GetTenantByIdUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    return { tenant: tenantToDTO(tenant) };
  }
}
