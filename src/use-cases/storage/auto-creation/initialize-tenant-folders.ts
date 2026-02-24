import {
  ROOT_SYSTEM_FOLDERS,
  FILTER_FOLDER_CONFIGS,
  slugify,
} from '@/constants/storage/folder-templates';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface InitializeTenantFoldersUseCaseRequest {
  tenantId: string;
}

interface InitializeTenantFoldersUseCaseResponse {
  folders: StorageFolder[];
}

export class InitializeTenantFoldersUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: InitializeTenantFoldersUseCaseRequest,
  ): Promise<InitializeTenantFoldersUseCaseResponse> {
    const { tenantId } = request;

    const createdFolders: StorageFolder[] = [];

    // Create root system folder tree
    for (const rootTemplate of ROOT_SYSTEM_FOLDERS) {
      const rootSlug = slugify(rootTemplate.name);
      const rootPath = `/${rootSlug}`;

      const existingRootFolder = await this.storageFoldersRepository.findByPath(
        rootPath,
        tenantId,
      );

      let rootFolder: StorageFolder;

      if (existingRootFolder) {
        rootFolder = existingRootFolder;
      } else {
        rootFolder = await this.storageFoldersRepository.create({
          tenantId,
          name: rootTemplate.name,
          slug: rootSlug,
          path: rootPath,
          icon: rootTemplate.icon,
          isSystem: true,
          module: rootTemplate.module ?? null,
          depth: 0,
        });

        createdFolders.push(rootFolder);
      }

      // Create children of this root folder
      if (rootTemplate.children) {
        for (const childTemplate of rootTemplate.children) {
          const childSlug = slugify(childTemplate.name);
          const childPath = `${rootPath}/${childSlug}`;

          const existingChildFolder =
            await this.storageFoldersRepository.findByPath(childPath, tenantId);

          if (!existingChildFolder) {
            const childFolder = await this.storageFoldersRepository.create({
              tenantId,
              parentId: rootFolder.id.toString(),
              name: childTemplate.name,
              slug: childSlug,
              path: childPath,
              icon: childTemplate.icon,
              isSystem: true,
              module: rootTemplate.module ?? null,
              depth: 1,
            });

            createdFolders.push(childFolder);
          }
        }
      }
    }

    // Create filter folders
    for (const filterConfig of FILTER_FOLDER_CONFIGS) {
      const existingFilterFolder =
        await this.storageFoldersRepository.findByPath(
          filterConfig.path,
          tenantId,
        );

      if (!existingFilterFolder) {
        const filterSlug = slugify(filterConfig.name);

        const filterFolder = await this.storageFoldersRepository.create({
          tenantId,
          name: filterConfig.name,
          slug: filterSlug,
          path: filterConfig.path,
          isSystem: true,
          isFilter: true,
          filterFileType: filterConfig.filterFileType,
          module: filterConfig.module,
          depth: 1,
        });

        createdFolders.push(filterFolder);
      }
    }

    return { folders: createdFolders };
  }
}
