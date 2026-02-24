import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFolderAccessRulesRepository } from '@/repositories/storage/in-memory/in-memory-folder-access-rules-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveFolderAccessUseCase } from './remove-folder-access';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let folderAccessRulesRepository: InMemoryFolderAccessRulesRepository;
let sut: RemoveFolderAccessUseCase;

const TENANT_ID = 'tenant-1';

describe('RemoveFolderAccessUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    folderAccessRulesRepository = new InMemoryFolderAccessRulesRepository();
    sut = new RemoveFolderAccessUseCase(
      storageFoldersRepository,
      folderAccessRulesRepository,
    );
  });

  async function createFolderWithAccessRule() {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });

    const rule = await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
      isInherited: false,
    });

    return { folder, rule };
  }

  it('should remove an access rule from a folder', async () => {
    const { folder, rule } = await createFolderWithAccessRule();

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      ruleId: rule.id.toString(),
    });

    expect(folderAccessRulesRepository.items).toHaveLength(0);
  });

  it('should remove inherited rules from descendant folders for the same user', async () => {
    const { folder, rule } = await createFolderWithAccessRule();

    const childFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: folder.id.toString(),
      name: 'Subfolder',
      slug: 'subfolder',
      path: '/documents/subfolder',
      depth: 1,
    });

    // Create an inherited rule on the child folder for the same user
    await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
      isInherited: true,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      ruleId: rule.id.toString(),
    });

    // Both the direct rule and the inherited rule should be gone
    expect(folderAccessRulesRepository.items).toHaveLength(0);
  });

  it('should not remove direct rules on descendant folders for the same user', async () => {
    const { folder, rule } = await createFolderWithAccessRule();

    const childFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: folder.id.toString(),
      name: 'Subfolder',
      slug: 'subfolder',
      path: '/documents/subfolder',
      depth: 1,
    });

    // Create a direct (non-inherited) rule on the child folder for the same user
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
      folderId: folder.id.toString(),
      ruleId: rule.id.toString(),
    });

    // The direct rule on the child should remain
    expect(folderAccessRulesRepository.items).toHaveLength(1);
    expect(folderAccessRulesRepository.items[0].isInherited).toBe(false);
  });

  it('should fail when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: new UniqueEntityID().toString(),
        ruleId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when rule does not exist', async () => {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        ruleId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when rule does not belong to the specified folder', async () => {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });

    const otherFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Other',
      slug: 'other',
      path: '/other',
    });

    const ruleOnOtherFolder = await folderAccessRulesRepository.create({
      tenantId: TENANT_ID,
      folderId: otherFolder.id.toString(),
      userId: 'user-1',
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        ruleId: ruleOnOtherFolder.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
