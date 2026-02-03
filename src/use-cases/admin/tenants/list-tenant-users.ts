import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { tenantUserToDTO } from '@/mappers/core/tenant/tenant-user-to-dto';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';

export interface TenantUserWithUserDTO {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    username: string;
  } | null;
}

interface ListTenantUsersUseCaseRequest {
  tenantId: string;
}

interface ListTenantUsersUseCaseResponse {
  users: TenantUserWithUserDTO[];
}

export class ListTenantUsersUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantUsersRepository: TenantUsersRepository,
    private usersRepository: UsersRepository,
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

    const userIds = allTenantUsers.map((tu) => tu.userId);
    const users = await this.usersRepository.findManyByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id.toString(), u]));

    const enrichedUsers: TenantUserWithUserDTO[] = allTenantUsers.map((tu) => {
      const dto = tenantUserToDTO(tu);
      const user = userMap.get(tu.userId.toString());
      return {
        ...dto,
        user: user
          ? {
              id: user.id.toString(),
              email: user.email.value,
              username: user.username.value,
            }
          : null,
      };
    });

    return { users: enrichedUsers };
  }
}
