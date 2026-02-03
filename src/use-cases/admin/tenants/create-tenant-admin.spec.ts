import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { DEFAULT_USER_PERMISSIONS } from '@/constants/rbac/permission-codes';
import {
  PermissionGroupSlugs,
  PermissionGroupColors,
  PermissionGroupPriorities,
} from '@/constants/rbac/permission-groups';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTenantAdminUseCase } from './create-tenant-admin';

let tenantsRepository: InMemoryTenantsRepository;
let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
let permissionsRepository: InMemoryPermissionsRepository;
let sut: CreateTenantAdminUseCase;

describe('CreateTenantAdminUseCase', () => {
  beforeEach(async () => {
    tenantsRepository = new InMemoryTenantsRepository();
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    permissionsRepository = new InMemoryPermissionsRepository();

    sut = new CreateTenantAdminUseCase(
      tenantsRepository,
      permissionGroupsRepository,
      permissionGroupPermissionsRepository,
      permissionsRepository,
    );

    // Seed some permissions for testing
    const testPermissions = [
      'self.profile.read',
      'self.profile.update',
      'self.sessions.list',
      'stock.products.create',
      'stock.products.read.all',
      'sales.orders.create',
    ];

    for (const code of testPermissions) {
      const pc = PermissionCode.create(code);
      await permissionsRepository.create({
        code: pc,
        name: code,
        description: null,
        module: pc.module,
        resource: pc.resource,
        action: pc.action,
        isSystem: true,
        metadata: {},
      });
    }
  });

  it('should create a tenant with minimal data', async () => {
    const { tenant } = await sut.execute({ name: 'My Company' });
    expect(tenant).toBeDefined();
    expect(tenant.name).toBe('My Company');
    expect(tenant.slug).toBe('my-company');
    expect(tenant.status).toBe('ACTIVE');
    expect(tenant.id).toEqual(expect.any(String));
  });

  it('should create a tenant with all fields', async () => {
    const { tenant } = await sut.execute({
      name: 'Enterprise Corp',
      slug: 'enterprise',
      logoUrl: 'https://example.com/logo.png',
      status: 'SUSPENDED',
    });
    expect(tenant.name).toBe('Enterprise Corp');
    expect(tenant.slug).toBe('enterprise');
    expect(tenant.logoUrl).toBe('https://example.com/logo.png');
    expect(tenant.status).toBe('SUSPENDED');
  });

  it('should trim the tenant name', async () => {
    const { tenant } = await sut.execute({ name: '  Acme Inc  ' });
    expect(tenant.name).toBe('Acme Inc');
  });

  it('should auto-generate slug from name', async () => {
    const { tenant } = await sut.execute({ name: 'Minha Empresa Legal' });
    expect(tenant.slug).toBe('minha-empresa-legal');
  });

  it('should throw BadRequestError when name is empty', async () => {
    await expect(() => sut.execute({ name: '' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should throw BadRequestError when name is only whitespace', async () => {
    await expect(() => sut.execute({ name: '   ' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should throw BadRequestError when slug already exists', async () => {
    await sut.execute({ name: 'Company A', slug: 'company' });
    await expect(() =>
      sut.execute({ name: 'Company B', slug: 'company' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should create Admin and User permission groups for the new tenant', async () => {
    const { tenant } = await sut.execute({ name: 'My Company' });

    const groups = permissionGroupsRepository.items.filter(
      (g) => g.tenantId?.toString() === tenant.id,
    );

    expect(groups).toHaveLength(2);

    const adminGroup = groups.find(
      (g) => g.slug === PermissionGroupSlugs.ADMIN,
    );
    const userGroup = groups.find((g) => g.slug === PermissionGroupSlugs.USER);

    expect(adminGroup).toBeDefined();
    expect(adminGroup!.name).toBe('Administrador');
    expect(adminGroup!.isSystem).toBe(true);
    expect(adminGroup!.priority).toBe(
      PermissionGroupPriorities[PermissionGroupSlugs.ADMIN],
    );
    expect(adminGroup!.color).toBe(
      PermissionGroupColors[PermissionGroupSlugs.ADMIN],
    );

    expect(userGroup).toBeDefined();
    expect(userGroup!.name).toBe('Usuario');
    expect(userGroup!.isSystem).toBe(true);
    expect(userGroup!.priority).toBe(
      PermissionGroupPriorities[PermissionGroupSlugs.USER],
    );
    expect(userGroup!.color).toBe(
      PermissionGroupColors[PermissionGroupSlugs.USER],
    );
  });

  it('should assign all permissions to the Admin group', async () => {
    const { tenant } = await sut.execute({ name: 'My Company' });

    const adminGroup = permissionGroupsRepository.items.find(
      (g) =>
        g.slug === PermissionGroupSlugs.ADMIN &&
        g.tenantId?.toString() === tenant.id,
    );

    const adminGroupPerms = permissionGroupPermissionsRepository.items.filter(
      (pgp) => pgp.groupId.equals(adminGroup!.id),
    );

    expect(adminGroupPerms.length).toBe(permissionsRepository.items.length);
  });

  it('should assign DEFAULT_USER_PERMISSIONS to the User group', async () => {
    const { tenant } = await sut.execute({ name: 'My Company' });

    const userGroup = permissionGroupsRepository.items.find(
      (g) =>
        g.slug === PermissionGroupSlugs.USER &&
        g.tenantId?.toString() === tenant.id,
    );

    const userGroupPerms = permissionGroupPermissionsRepository.items.filter(
      (pgp) => pgp.groupId.equals(userGroup!.id),
    );

    // Only the permissions that match DEFAULT_USER_PERMISSIONS should be assigned
    const matchingCodes = DEFAULT_USER_PERMISSIONS.filter((code) =>
      permissionsRepository.items.some((p) => p.code.value === code),
    );

    expect(userGroupPerms.length).toBe(matchingCodes.length);
    expect(userGroupPerms.length).toBeGreaterThan(0);
  });

  it('should set correct tenantId on groups', async () => {
    const { tenant } = await sut.execute({ name: 'My Company' });

    const groups = permissionGroupsRepository.items.filter(
      (g) => g.tenantId?.toString() === tenant.id,
    );

    for (const group of groups) {
      expect(group.tenantId?.toString()).toBe(tenant.id);
    }
  });
});
