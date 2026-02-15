import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Email } from '@/entities/core/value-objects/email';
import { Password } from '@/entities/core/value-objects/password';
import { Url } from '@/entities/core/value-objects/url';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantUserDTO,
  tenantUserToDTO,
} from '@/mappers/core/tenant/tenant-user-to-dto';
import { type UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import type { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';
import { PermissionGroupSlugs } from '@/constants/rbac/permission-groups';

interface CreateTenantUserAdminUseCaseRequest {
  tenantId: string;
  email: string;
  password: string;
  username?: string;
  role?: string;
}

interface CreateTenantUserAdminUseCaseResponse {
  user: UserDTO;
  tenantUser: TenantUserDTO;
}

export class CreateTenantUserAdminUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private usersRepository: UsersRepository,
    private tenantUsersRepository: TenantUsersRepository,
    private permissionGroupsRepository: PermissionGroupsRepository,
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
  ) {}

  async execute({
    tenantId,
    email,
    password,
    username,
    role = 'member',
  }: CreateTenantUserAdminUseCaseRequest): Promise<CreateTenantUserAdminUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const validEmail = Email.create(email);
    const validPassword = await Password.create(password);
    const validUsername = username
      ? Username.create(username)
      : Username.random();

    const userWithSameEmail =
      await this.usersRepository.findByEmail(validEmail);
    if (userWithSameEmail) {
      throw new BadRequestError('This email is already in use.');
    }

    const userWithSameUsername =
      await this.usersRepository.findByUsername(validUsername);
    if (userWithSameUsername) {
      throw new BadRequestError('This username is already in use.');
    }

    const newUser = await this.usersRepository.create({
      email: validEmail,
      username: validUsername,
      passwordHash: validPassword,
      profile: {
        name: '',
        surname: '',
        birthday: null,
        location: '',
        bio: '',
        avatarUrl: Url.empty(),
      },
    });

    const tenantUser = await this.tenantUsersRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      userId: newUser.id,
      role,
    });

    // Auto-assign permission group based on role
    const baseSlug =
      role === 'owner' ? PermissionGroupSlugs.ADMIN : PermissionGroupSlugs.USER;
    const tenantIdPrefix = tenantId.substring(0, 8);
    const tenantIdEntity = new UniqueEntityID(tenantId);

    // Try tenant-specific slug first (new format), then fall back to bare slug (legacy)
    let group = await this.permissionGroupsRepository.findBySlugAndTenantId(
      `${baseSlug}-${tenantIdPrefix}`,
      tenantIdEntity,
    );
    if (!group) {
      group = await this.permissionGroupsRepository.findBySlugAndTenantId(
        baseSlug,
        tenantIdEntity,
      );
    }

    if (group) {
      await this.userPermissionGroupsRepository.assign({
        userId: newUser.id,
        groupId: group.id,
        expiresAt: null,
        grantedBy: null,
      });
    }

    return {
      user: userToDTO(newUser),
      tenantUser: tenantUserToDTO(tenantUser),
    };
  }
}
