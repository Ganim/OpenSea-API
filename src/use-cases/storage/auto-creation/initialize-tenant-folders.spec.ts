import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  FILTER_FOLDER_CONFIGS,
  ROOT_SYSTEM_FOLDERS,
  slugify,
} from '@/constants/storage/folder-templates';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { InitializeTenantFoldersUseCase } from './initialize-tenant-folders';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: InitializeTenantFoldersUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Initialize Tenant Folders Use Case', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new InitializeTenantFoldersUseCase(storageFoldersRepository);
  });

  it('should create all root system folders', async () => {
    const { folders } = await sut.execute({ tenantId });

    for (const template of ROOT_SYSTEM_FOLDERS) {
      const rootSlug = slugify(template.name);
      const rootPath = `/${rootSlug}`;

      const rootFolder = storageFoldersRepository.items.find(
        (folder) =>
          folder.path === rootPath && folder.tenantId.toString() === tenantId,
      );

      expect(rootFolder).toBeDefined();
      expect(rootFolder!.name).toBe(template.name);
      expect(rootFolder!.isSystem).toBe(true);
      expect(rootFolder!.icon).toBe(template.icon);
      expect(rootFolder!.module).toBe(template.module ?? null);
      expect(rootFolder!.depth).toBe(0);
    }

    expect(folders.length).toBeGreaterThan(0);
  });

  it('should create child folders under their respective root folders', async () => {
    await sut.execute({ tenantId });

    for (const template of ROOT_SYSTEM_FOLDERS) {
      if (!template.children) continue;

      const rootSlug = slugify(template.name);
      const rootPath = `/${rootSlug}`;

      const rootFolder = storageFoldersRepository.items.find(
        (folder) =>
          folder.path === rootPath && folder.tenantId.toString() === tenantId,
      );

      expect(rootFolder).toBeDefined();

      for (const child of template.children) {
        const childSlug = slugify(child.name);
        const childPath = `${rootPath}/${childSlug}`;

        const childFolder = storageFoldersRepository.items.find(
          (folder) =>
            folder.path === childPath &&
            folder.tenantId.toString() === tenantId,
        );

        expect(childFolder).toBeDefined();
        expect(childFolder!.name).toBe(child.name);
        expect(childFolder!.isSystem).toBe(true);
        expect(childFolder!.parentId?.toString()).toBe(
          rootFolder!.id.toString(),
        );
        expect(childFolder!.depth).toBe(1);
      }
    }
  });

  it('should create all filter folders', async () => {
    await sut.execute({ tenantId });

    for (const filterConfig of FILTER_FOLDER_CONFIGS) {
      const filterFolder = storageFoldersRepository.items.find(
        (folder) =>
          folder.path === filterConfig.path &&
          folder.tenantId.toString() === tenantId,
      );

      expect(filterFolder).toBeDefined();
      expect(filterFolder!.name).toBe(filterConfig.name);
      expect(filterFolder!.isSystem).toBe(true);
      expect(filterFolder!.isFilter).toBe(true);
      expect(filterFolder!.filterFileType).toBe(filterConfig.filterFileType);
      expect(filterFolder!.module).toBe(filterConfig.module);
    }
  });

  it('should be idempotent - not duplicate folders on second run', async () => {
    const firstRun = await sut.execute({ tenantId });
    const firstRunCount = storageFoldersRepository.items.length;

    const secondRun = await sut.execute({ tenantId });

    expect(storageFoldersRepository.items.length).toBe(firstRunCount);
    expect(secondRun.folders).toHaveLength(0);
    expect(firstRun.folders.length).toBeGreaterThan(0);
  });

  it('should not affect folders from another tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await sut.execute({ tenantId });
    await sut.execute({ tenantId: otherTenantId });

    const tenantFolders = storageFoldersRepository.items.filter(
      (folder) => folder.tenantId.toString() === tenantId,
    );

    const otherTenantFolders = storageFoldersRepository.items.filter(
      (folder) => folder.tenantId.toString() === otherTenantId,
    );

    expect(tenantFolders.length).toBe(otherTenantFolders.length);
  });

  it('should create children even if root already exists', async () => {
    // Manually create a root folder first
    const rootTemplate = ROOT_SYSTEM_FOLDERS[0];
    const rootSlug = slugify(rootTemplate.name);
    const rootPath = `/${rootSlug}`;

    await storageFoldersRepository.create({
      tenantId,
      name: rootTemplate.name,
      slug: rootSlug,
      path: rootPath,
      icon: rootTemplate.icon,
      isSystem: true,
      module: rootTemplate.module ?? null,
      depth: 0,
    });

    const { folders } = await sut.execute({ tenantId });

    // The root folder should NOT be in the created list (already existed)
    const createdRootFolder = folders.find(
      (folder) => folder.path === rootPath,
    );
    expect(createdRootFolder).toBeUndefined();

    // But children should have been created
    if (rootTemplate.children && rootTemplate.children.length > 0) {
      for (const child of rootTemplate.children) {
        const childSlug = slugify(child.name);
        const childPath = `${rootPath}/${childSlug}`;

        const childFolder = storageFoldersRepository.items.find(
          (folder) =>
            folder.path === childPath &&
            folder.tenantId.toString() === tenantId,
        );

        expect(childFolder).toBeDefined();
      }
    }
  });
});
