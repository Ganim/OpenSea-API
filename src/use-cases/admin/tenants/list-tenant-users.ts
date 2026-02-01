import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantUserDTO,
  tenantUserToDTO,
} from '@/mappers/core/tenant/tenant-user-to-dto';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface ListTenantUsersUseCaseRequest {
  tenantId: string;
}

interface ListTenantUsersUseCaseResponse {
  tenantUsers: TenantUserDTO[];
}

export class ListTenantUsersUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantUsersRepository: TenantUsersRepository,
  ) {}

  async execute({
    tenantId,
  }: ListTenantUsersUseCaseRequest): Promise<ListTenantUsersUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const allTenantUsers = await this.tenantUsersRepository.findByTenant(
      new UniqueEntityID(tenantId),
    );

    return { tenantUsers: allTenantUsers.map(tenantUserToDTO) };
  }
}
