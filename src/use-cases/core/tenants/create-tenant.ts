import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Tenant } from '@/entities/core/tenant';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantPlansRepository } from '@/repositories/core/tenant-plans-repository';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { PlansRepository } from '@/repositories/core/plans-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface CreateTenantUseCaseRequest {
  name: string;
  slug?: string;
  logoUrl?: string;
  userId: string; // The user creating the tenant (will be auto-assigned as owner)
}

interface CreateTenantUseCaseResponse {
  tenant: TenantDTO;
}

export class CreateTenantUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantUsersRepository: TenantUsersRepository,
    private tenantPlansRepository: TenantPlansRepository,
    private plansRepository: PlansRepository,
  ) {}

  async execute({
    name,
    slug,
    logoUrl,
    userId,
  }: CreateTenantUseCaseRequest): Promise<CreateTenantUseCaseResponse> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Tenant name is required');
    }

    if (name.length > 128) {
      throw new BadRequestError('Tenant name must be at most 128 characters');
    }

    const tenantSlug = slug || Tenant.generateSlug(name);

    if (tenantSlug.length > 128) {
      throw new BadRequestError('Tenant slug must be at most 128 characters');
    }

    const existingTenant = await this.tenantsRepository.findBySlug(tenantSlug);
    if (existingTenant) {
      throw new BadRequestError('A tenant with this slug already exists');
    }

    const tenant = await this.tenantsRepository.create({
      name: name.trim(),
      slug: tenantSlug,
      logoUrl: logoUrl ?? null,
    });

    // Auto-assign the creating user as owner
    await this.tenantUsersRepository.create({
      tenantId: tenant.tenantId,
      userId: new UniqueEntityID(userId),
      role: 'owner',
    });

    // Auto-assign FREE plan
    const freePlan = await this.plansRepository.findByName('Free');
    if (freePlan) {
      await this.tenantPlansRepository.create({
        tenantId: tenant.tenantId,
        planId: freePlan.planId,
      });
    }

    return { tenant: tenantToDTO(tenant) };
  }
}
