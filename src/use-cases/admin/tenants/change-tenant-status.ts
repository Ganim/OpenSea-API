import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TenantStatus } from '@/entities/core/tenant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

const VALID_TENANT_STATUSES: TenantStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
];

interface ChangeTenantStatusUseCaseRequest {
  tenantId: string;
  status: TenantStatus;
}

interface ChangeTenantStatusUseCaseResponse {
  tenant: TenantDTO;
}

export class ChangeTenantStatusUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    tenantId,
    status,
  }: ChangeTenantStatusUseCaseRequest): Promise<ChangeTenantStatusUseCaseResponse> {
    if (!VALID_TENANT_STATUSES.includes(status)) {
      throw new BadRequestError(
        `Invalid tenant status. Must be one of: ${VALID_TENANT_STATUSES.join(', ')}`,
      );
    }

    const existingTenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!existingTenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    if (existingTenant.status === status) {
      throw new BadRequestError(`Tenant is already ${status}`);
    }

    const updatedTenant = await this.tenantsRepository.update({
      id: new UniqueEntityID(tenantId),
      status,
    });

    if (!updatedTenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    return { tenant: tenantToDTO(updatedTenant) };
  }
}
