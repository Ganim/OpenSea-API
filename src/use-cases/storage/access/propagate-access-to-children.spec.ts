import { InMemoryFolderAccessRulesRepository } from '@/repositories/storage/in-memory/in-memory-folder-access-rules-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PropagateAccessToChildrenUseCase } from './propagate-access-to-children';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let folderAccessRulesRepository: InMemoryFolderAccessRulesRepository;
let sut: PropagateAccessToChildrenUseCase;

const TENANT_ID = 'tenant-1';

describe('PropagateAccessToChildrenUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    folderAccessRulesRepository = new InMemoryFolderAccessRulesRepository();
    sut = new PropagateAccessToChildrenUseCase(
      storageFoldersRepository,
      folderAccessRulesRepository,
    );
  });

  async function createFolderHierarchy() {
    const rootFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Root',
      slug: 'root',
      path: '/root',
    });

    const childFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: rootFolder.id.toString(),
      name: 'Child',
      slug: 'child',
      path: '/root/child',
      depth: 1,
    });

    const grandchildFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: childFolder.id.toString(),
      name: 'Grandchild',
      slug: 'grandchild',
      path: '/root/child/grandchild',
      depth: 2,
    });

    return { rootFolder, childFolder, grandchildFolder };
  }

  it('should propagate user access rules to all descendant folders', async () => {
    const { rootFolder } = await createFolderHierarchy();

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: rootFolder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    const inheritedRules = folderAccessRulesRepository.items.filter(
      (rule) => rule.isInherited,
    );

    expect(inheritedRules).toHaveLength(2);
    expect(inheritedRules.every((rule) => rule.canRead)).toBe(true);
    expect(inheritedRules.every((rule) => rule.canWrite)).toBe(true);
    expect(inheritedRules.every((rule) => rule.canDelete)).toBe(false);
    expect(inheritedRules.every((rule) => rule.isInherited)).toBe(true);
  });

  it('should propagate group access rules to all descendant folders', async () => {
    const { rootFolder } = await createFolderHierarchy();

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: rootFolder.id.toString(),
      groupId: 'group-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: true,
    });

    const inheritedRules = folderAccessRulesRepository.items.filter(
      (rule) => rule.isInherited,
    );

    expect(inheritedRules).toHaveLength(2);
    expect(
      inheritedRules.every((rule) => rule.groupId?.toString() === 'group-1'),
    ).toBe(true);
    expect(inheritedRules.every((rule) => rule.canShare)).toBe(true);
  });

  it('should skip descendant folders that already have a rule for the same user', async () => {
    const { rootFolder, childFolder } = await createFolderHierarchy();

    // Pre-create a direct rule on the child folder for user-1
    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
      isInherited: false,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: rootFolder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });

    // Only grandchild should get an inherited rule (child already has one)
    const inheritedRules = folderAccessRulesRepository.items.filter(
      (rule) => rule.isInherited,
    );

    expect(inheritedRules).toHaveLength(1);
  });

  it('should skip descendant folders that already have a rule for the same group', async () => {
    const { rootFolder, childFolder } = await createFolderHierarchy();

    // Pre-create a direct rule on the child folder for group-1
    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
      groupId: 'group-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
      isInherited: false,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: rootFolder.id.toString(),
      groupId: 'group-1',
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });

    const inheritedRules = folderAccessRulesRepository.items.filter(
      (rule) => rule.isInherited,
    );

    expect(inheritedRules).toHaveLength(1);
  });

  it('should not create rules when there are no descendant folders', async () => {
    const grandchildFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Leaf',
      slug: 'leaf',
      path: '/leaf',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: grandchildFolder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    expect(folderAccessRulesRepository.items).toHaveLength(0);
  });
});
