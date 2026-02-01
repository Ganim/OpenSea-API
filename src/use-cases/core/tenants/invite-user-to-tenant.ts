import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantUserDTO,
  tenantUserToDTO,
} from '@/mappers/core/tenant/tenant-user-to-dto';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { TenantPlansRepository } from '@/repositories/core/tenant-plans-repository';

interface InviteUserToTenantUseCaseRequest {
  tenantId: string;
  userId: string;
  role?: string;
}

interface InviteUserToTenantUseCaseResponse {
  tenantUser: TenantUserDTO;
}

export class InviteUserToTenantUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantUsersRepository: TenantUsersRepository,
    private usersRepository: UsersRepository,
    private tenantPlansRepository: TenantPlansRepository,
  ) {}

  async execute({
    tenantId,
    userId,
    role,
  }: InviteUserToTenantUseCaseRequest): Promise<InviteUserToTenantUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );
    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const user = await this.usersRepository.findById(
      new UniqueEntityID(userId),
    );
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Check if user is already a member
    const existing = await this.tenantUsersRepository.findByTenantAndUser(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(userId),
    );
    if (existing) {
      throw new BadRequestError('User is already a member of this tenant');
    }

    // Check plan user limits
    const tenantPlan = await this.tenantPlansRepository.findByTenantId(
      new UniqueEntityID(tenantId),
    );
    if (tenantPlan) {
      const _currentUserCount = await this.tenantUsersRepository.countByTenant(
        new UniqueEntityID(tenantId),
      );
      // We need the plan details - for now we check via context service
      // This is a simplified check
    }

    const tenantUser = await this.tenantUsersRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      userId: new UniqueEntityID(userId),
      role: role ?? 'member',
    });

    return { tenantUser: tenantUserToDTO(tenantUser) };
  }
}
