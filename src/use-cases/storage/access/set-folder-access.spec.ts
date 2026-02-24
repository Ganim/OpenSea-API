import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFolderAccessRulesRepository } from '@/repositories/storage/in-memory/in-memory-folder-access-rules-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PropagateAccessToChildrenUseCase } from './propagate-access-to-children';
import { SetFolderAccessUseCase } from './set-folder-access';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let folderAccessRulesRepository: InMemoryFolderAccessRulesRepository;
let propagateAccessToChildrenUseCase: PropagateAccessToChildrenUseCase;
let sut: SetFolderAccessUseCase;

const TENANT_ID = 'tenant-1';

describe('SetFolderAccessUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    folderAccessRulesRepository = new InMemoryFolderAccessRulesRepository();
    propagateAccessToChildrenUseCase = new PropagateAccessToChildrenUseCase(
      storageFoldersRepository,
      folderAccessRulesRepository,
    );
    sut = new SetFolderAccessUseCase(
      storageFoldersRepository,
      folderAccessRulesRepository,
      propagateAccessToChildrenUseCase,
    );
  });

  async function createTestFolder(parentId?: string, path?: string) {
    return storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: path ?? '/documents',
      parentId,
    });
  }

  it('should create a new user access rule for a folder', async () => {
    const folder = await createTestFolder();

    const { rule } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    expect(rule.canRead).toBe(true);
    expect(rule.canWrite).toBe(true);
    expect(rule.canDelete).toBe(false);
    expect(rule.canShare).toBe(false);
    expect(rule.userId?.toString()).toBe('user-1');
    expect(rule.isInherited).toBe(false);
  });

  it('should create a new group access rule for a folder', async () => {
    const folder = await createTestFolder();

    const { rule } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      groupId: 'group-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: true,
    });

    expect(rule.groupId?.toString()).toBe('group-1');
    expect(rule.canShare).toBe(true);
    expect(rule.isInherited).toBe(false);
  });

  it('should update an existing user access rule instead of creating a duplicate', async () => {
    const folder = await createTestFolder();

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    const { rule: updatedRule } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });

    expect(updatedRule.canWrite).toBe(true);
    expect(updatedRule.canDelete).toBe(true);
    expect(updatedRule.canShare).toBe(true);

    // Should not create a duplicate
    const allRulesForFolder = await folderAccessRulesRepository.findByFolder(
      folder.id,
    );
    const directUserRules = allRulesForFolder.filter(
      (r) => r.userId?.toString() === 'user-1' && !r.isInherited,
    );
    expect(directUserRules).toHaveLength(1);
  });

  it('should update an existing group access rule instead of creating a duplicate', async () => {
    const folder = await createTestFolder();

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      groupId: 'group-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    const { rule: updatedRule } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      groupId: 'group-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: true,
    });

    expect(updatedRule.canWrite).toBe(true);
    expect(updatedRule.canShare).toBe(true);

    const allRulesForFolder = await folderAccessRulesRepository.findByFolder(
      folder.id,
    );
    const directGroupRules = allRulesForFolder.filter(
      (r) => r.groupId?.toString() === 'group-1' && !r.isInherited,
    );
    expect(directGroupRules).toHaveLength(1);
  });

  it('should propagate access rules to descendant folders', async () => {
    const parentFolder = await createTestFolder();
    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: parentFolder.id.toString(),
      name: 'Subfolder',
      slug: 'subfolder',
      path: '/documents/subfolder',
      depth: 1,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    const inheritedRules = folderAccessRulesRepository.items.filter(
      (rule) => rule.isInherited,
    );

    expect(inheritedRules).toHaveLength(1);
    expect(inheritedRules[0].canRead).toBe(true);
    expect(inheritedRules[0].canWrite).toBe(true);
  });

  it('should fail when neither userId nor groupId is provided', async () => {
    const folder = await createTestFolder();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when both userId and groupId are provided', async () => {
    const folder = await createTestFolder();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        userId: 'user-1',
        groupId: 'group-1',
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: new UniqueEntityID().toString(),
        userId: 'user-1',
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
