import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface DeleteTenantAdminUseCaseRequest {
  tenantId: string;
}

interface DeleteTenantAdminUseCaseResponse {
  tenant: TenantDTO;
}

export class DeleteTenantAdminUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    tenantId,
  }: DeleteTenantAdminUseCaseRequest): Promise<DeleteTenantAdminUseCaseResponse> {
    const existing = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const deactivated = await this.tenantsRepository.update({
      id: new UniqueEntityID(tenantId),
      status: 'INACTIVE',
    });

    if (!deactivated) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    return { tenant: tenantToDTO(deactivated) };
  }
}
