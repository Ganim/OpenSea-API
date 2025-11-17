import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPermissionByIdUseCase } from './get-permission-by-id';

describe('GetPermissionByIdUseCase', () => {
  let useCase: GetPermissionByIdUseCase;
  let permissionsRepository: InMemoryPermissionsRepository;

  beforeEach(() => {
    permissionsRepository = new InMemoryPermissionsRepository();
    useCase = new GetPermissionByIdUseCase(permissionsRepository);
  });

  it('should get a permission by id', async () => {
    const code = PermissionCode.create('users.profile.read');

    const permission = await permissionsRepository.create({
      code,
      name: 'Read User Profile',
      description: 'Can read user profile',
      module: code.module,
      resource: code.resource,
      action: code.action,
      isSystem: false,
      metadata: {},
    });

    const result = await useCase.execute({
      id: permission.id.toString(),
    });

    expect(result.permission).toEqual(permission);
    expect(result.permission.name).toBe('Read User Profile');
  });

  it('should throw error when permission is not found', async () => {
    await expect(
      useCase.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should get a system permission', async () => {
    const code = PermissionCode.create('system.admin.all');

    const permission = await permissionsRepository.create({
      code,
      name: 'System Admin',
      description: 'Full system access',
      module: code.module,
      resource: code.resource,
      action: code.action,
      isSystem: true,
      metadata: { critical: true },
    });

    const result = await useCase.execute({
      id: permission.id.toString(),
    });

    expect(result.permission.isSystem).toBe(true);
    expect(result.permission.metadata).toEqual({ critical: true });
  });
});
