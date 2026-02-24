import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFolderAccessRulesRepository } from '@/repositories/storage/in-memory/in-memory-folder-access-rules-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListFolderAccessUseCase } from './list-folder-access';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let folderAccessRulesRepository: InMemoryFolderAccessRulesRepository;
let sut: ListFolderAccessUseCase;

const TENANT_ID = 'tenant-1';

describe('ListFolderAccessUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    folderAccessRulesRepository = new InMemoryFolderAccessRulesRepository();
    sut = new ListFolderAccessUseCase(
      storageFoldersRepository,
      folderAccessRulesRepository,
    );
  });

  it('should list all access rules for a folder', async () => {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      groupId: 'group-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-2',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
      isInherited: true,
    });

    const { rules } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    expect(rules).toHaveLength(3);
  });

  it('should return both direct and inherited rules', async () => {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
      isInherited: false,
    });

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-2',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
      isInherited: true,
    });

    const { rules } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    const directRules = rules.filter((r) => !r.isInherited);
    const inheritedRules = rules.filter((r) => r.isInherited);

    expect(directRules).toHaveLength(1);
    expect(inheritedRules).toHaveLength(1);
  });

  it('should return empty array when folder has no access rules', async () => {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Empty Folder',
      slug: 'empty-folder',
      path: '/empty-folder',
    });

    const { rules } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    expect(rules).toHaveLength(0);
  });

  it('should not return rules from other folders', async () => {
    const folderA = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Folder A',
      slug: 'folder-a',
      path: '/folder-a',
    });

    const folderB = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Folder B',
      slug: 'folder-b',
      path: '/folder-b',
    });

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folderA.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });

    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folderB.id.toString(),
      userId: 'user-2',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    const { rules } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folderA.id.toString(),
    });

    expect(rules).toHaveLength(1);
    expect(rules[0].userId?.toString()).toBe('user-1');
  });

  it('should fail when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
