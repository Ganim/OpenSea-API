import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface UpdateTenantUseCaseRequest {
  tenantId: string;
  name?: string;
  logoUrl?: string | null;
  settings?: Record<string, unknown>;
}

interface UpdateTenantUseCaseResponse {
  tenant: TenantDTO;
}

export class UpdateTenantUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    tenantId,
    name,
    logoUrl,
    settings,
  }: UpdateTenantUseCaseRequest): Promise<UpdateTenantUseCaseResponse> {
    const existing = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError('Tenant name cannot be empty');
    }

    const tenant = await this.tenantsRepository.update({
      id: new UniqueEntityID(tenantId),
      ...(name !== undefined && { name: name.trim() }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(settings !== undefined && { settings }),
    });

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    return { tenant: tenantToDTO(tenant) };
  }
}
