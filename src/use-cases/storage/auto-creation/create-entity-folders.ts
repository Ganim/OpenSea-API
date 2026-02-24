import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  ENTITY_FOLDER_CONFIGS,
  slugify,
} from '@/constants/storage/folder-templates';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface CreateEntityFoldersUseCaseRequest {
  tenantId: string;
  entityType: string;
  entityId: string;
  entityName: string;
}

interface CreateEntityFoldersUseCaseResponse {
  folders: StorageFolder[];
}

export class CreateEntityFoldersUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: CreateEntityFoldersUseCaseRequest,
  ): Promise<CreateEntityFoldersUseCaseResponse> {
    const { tenantId, entityType, entityId, entityName } = request;

    const entityConfig = ENTITY_FOLDER_CONFIGS.find(
      (config) => config.entityType === entityType,
    );

    if (!entityConfig) {
      throw new BadRequestError(
        `No folder configuration found for entity type: ${entityType}`,
      );
    }

    // Verify the base path folder exists
    const baseFolder = await this.storageFoldersRepository.findByPath(
      entityConfig.basePath,
      tenantId,
    );

    if (!baseFolder) {
      throw new ResourceNotFoundError(
        `Base folder not found at path: ${entityConfig.basePath}. Run tenant initialization first.`,
      );
    }

    // Check if entity folder already exists
    const existingEntityFolder =
      await this.storageFoldersRepository.findByEntityId(
        entityType,
        entityId,
        tenantId,
      );

    if (existingEntityFolder) {
      throw new BadRequestError(
        `Folder already exists for ${entityType} with id: ${entityId}`,
      );
    }

    const createdFolders: StorageFolder[] = [];

    const entitySlug = slugify(entityName);
    const entityPath = `${entityConfig.basePath}/${entitySlug}`;

    // Create the main entity folder
    const entityFolder = await this.storageFoldersRepository.create({
      tenantId,
      parentId: baseFolder.id.toString(),
      name: entityName,
      slug: entitySlug,
      path: entityPath,
      isSystem: true,
      module: entityConfig.module,
      entityType,
      entityId,
      depth: baseFolder.depth + 1,
    });

    createdFolders.push(entityFolder);

    // Create subfolders defined in the config
    for (const subfolderName of entityConfig.subfolders) {
      const subfolderSlug = slugify(subfolderName);
      const subfolderPath = `${entityPath}/${subfolderSlug}`;

      const subfolder = await this.storageFoldersRepository.create({
        tenantId,
        parentId: entityFolder.id.toString(),
        name: subfolderName,
        slug: subfolderSlug,
        path: subfolderPath,
        isSystem: true,
        module: entityConfig.module,
        depth: entityFolder.depth + 1,
      });

      createdFolders.push(subfolder);
    }

    return { folders: createdFolders };
  }
}
