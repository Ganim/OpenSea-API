import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPermissionGroupPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-group-permissions-repository';
import { InMemoryPermissionGroupsRepository } from '@/repositories/rbac/in-memory/in-memory-permission-groups-repository';
import { InMemoryPermissionsRepository } from '@/repositories/rbac/in-memory/in-memory-permissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { BulkAddPermissionsToGroupUseCase } from './bulk-add-permissions-to-group';

let permissionGroupsRepository: InMemoryPermissionGroupsRepository;
let permissionsRepository: InMemoryPermissionsRepository;
let permissionGroupPermissionsRepository: InMemoryPermissionGroupPermissionsRepository;
let sut: BulkAddPermissionsToGroupUseCase;

describe('BulkAddPermissionsToGroupUseCase', () => {
  beforeEach(() => {
    permissionGroupsRepository = new InMemoryPermissionGroupsRepository();
    permissionsRepository = new InMemoryPermissionsRepository();
    permissionGroupPermissionsRepository =
      new InMemoryPermissionGroupPermissionsRepository();
    sut = new BulkAddPermissionsToGroupUseCase(
      permissionGroupsRepository,
      permissionsRepository,
      permissionGroupPermissionsRepository,
    );
  });

  it('should throw ResourceNotFoundError for non-existent group', async () => {
    await expect(() =>
      sut.execute({
        groupId: 'non-existent',
        permissions: [
          { permissionCode: 'stock.products.create', effect: 'allow' },
        ],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
