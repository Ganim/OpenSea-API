import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Tenant, type TenantStatus } from '@/entities/core/tenant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import {
  PermissionGroupSlugs,
  PermissionGroupColors,
  PermissionGroupPriorities,
} from '@/constants/rbac/permission-groups';
import { DEFAULT_USER_PERMISSIONS } from '@/constants/rbac/permission-codes';

interface CreateTenantAdminUseCaseRequest {
  name: string;
  slug?: string;
  logoUrl?: string | null;
  status?: TenantStatus;
}

interface CreateTenantAdminUseCaseResponse {
  tenant: TenantDTO;
}

export class CreateTenantAdminUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private permissionGroupsRepository: PermissionGroupsRepository,
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
    private permissionsRepository: PermissionsRepository,
  ) {}

  async execute({
    name,
    slug,
    logoUrl,
    status,
  }: CreateTenantAdminUseCaseRequest): Promise<CreateTenantAdminUseCaseResponse> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Tenant name is required');
    }

    if (name.length > 128) {
      throw new BadRequestError('Tenant name must be at most 128 characters');
    }

    const tenantSlug = slug?.trim() || Tenant.generateSlug(name);

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
      status: status ?? 'ACTIVE',
    });

    await this.createDefaultPermissionGroups(tenant.tenantId);

    return { tenant: tenantToDTO(tenant) };
  }

  private async createDefaultPermissionGroups(
    tenantId: UniqueEntityID,
  ): Promise<void> {
    const tenantIdPrefix = tenantId.toString().substring(0, 8);

    // 1. Create Admin group for this tenant
    const adminGroup = await this.permissionGroupsRepository.create({
      name: 'Administrador',
      slug: `${PermissionGroupSlugs.ADMIN}-${tenantIdPrefix}`,
      description: 'Acesso completo ao sistema com todas as permissões.',
      isSystem: false,
      isActive: true,
      color: PermissionGroupColors[PermissionGroupSlugs.ADMIN],
      priority: PermissionGroupPriorities[PermissionGroupSlugs.ADMIN],
      parentId: null,
      tenantId,
    });

    // 2. Assign ALL permissions to Admin group
    const allPermissions = await this.permissionsRepository.listAll();

    if (allPermissions.length > 0) {
      await this.permissionGroupPermissionsRepository.addMany(
        allPermissions.map((p) => ({
          groupId: adminGroup.id,
          permissionId: p.id,
          effect: PermissionEffect.allow(),
          conditions: null,
        })),
      );
    }

    // 3. Create User group for this tenant
    const userGroup = await this.permissionGroupsRepository.create({
      name: 'Usuário',
      slug: `${PermissionGroupSlugs.USER}-${tenantIdPrefix}`,
      description: 'Acesso básico aos próprios dados do usuário.',
      isSystem: false,
      isActive: true,
      color: PermissionGroupColors[PermissionGroupSlugs.USER],
      priority: PermissionGroupPriorities[PermissionGroupSlugs.USER],
      parentId: null,
      tenantId,
    });

    // 4. Assign DEFAULT_USER_PERMISSIONS to User group
    const userPermissionCodes = DEFAULT_USER_PERMISSIONS.map((code) =>
      PermissionCode.create(code),
    );

    const userPermissions =
      await this.permissionsRepository.findManyByCodes(userPermissionCodes);

    if (userPermissions.length > 0) {
      await this.permissionGroupPermissionsRepository.addMany(
        userPermissions.map((p) => ({
          groupId: userGroup.id,
          permissionId: p.id,
          effect: PermissionEffect.allow(),
          conditions: null,
        })),
      );
    }
  }
}
