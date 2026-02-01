import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { tenantToSummaryDTO } from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

export interface UserTenantDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  role: string;
  joinedAt: Date;
}

interface ListUserTenantsUseCaseRequest {
  userId: string;
}

interface ListUserTenantsUseCaseResponse {
  tenants: UserTenantDTO[];
}

export class ListUserTenantsUseCase {
  constructor(
    private tenantUsersRepository: TenantUsersRepository,
    private tenantsRepository: TenantsRepository,
  ) {}

  async execute({
    userId,
  }: ListUserTenantsUseCaseRequest): Promise<ListUserTenantsUseCaseResponse> {
    const tenantUsers = await this.tenantUsersRepository.findByUser(
      new UniqueEntityID(userId),
    );

    const tenants: UserTenantDTO[] = [];

    for (const tu of tenantUsers) {
      const tenant = await this.tenantsRepository.findById(tu.tenantId);
      if (tenant && tenant.isActive) {
        const summary = tenantToSummaryDTO(tenant);
        tenants.push({
          ...summary,
          role: tu.role,
          joinedAt: tu.joinedAt,
        });
      }
    }

    return { tenants };
  }
}
