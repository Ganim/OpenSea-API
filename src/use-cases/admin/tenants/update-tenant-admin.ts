import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface UpdateTenantAdminUseCaseRequest {
  tenantId: string;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  settings?: Record<string, unknown>;
}

interface UpdateTenantAdminUseCaseResponse {
  tenant: TenantDTO;
}

export class UpdateTenantAdminUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    tenantId,
    name,
    slug,
    logoUrl,
    settings,
  }: UpdateTenantAdminUseCaseRequest): Promise<UpdateTenantAdminUseCaseResponse> {
    const existing = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError('Tenant name cannot be empty');
    }

    if (slug !== undefined) {
      if (slug.trim().length === 0) {
        throw new BadRequestError('Tenant slug cannot be empty');
      }

      if (slug.trim() !== existing.slug) {
        const existingWithSlug = await this.tenantsRepository.findBySlug(
          slug.trim(),
        );
        if (existingWithSlug) {
          throw new BadRequestError('A tenant with this slug already exists');
        }
      }
    }

    const tenant = await this.tenantsRepository.update({
      id: new UniqueEntityID(tenantId),
      ...(name !== undefined && { name: name.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(settings !== undefined && { settings }),
    });

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    return { tenant: tenantToDTO(tenant) };
  }
}
