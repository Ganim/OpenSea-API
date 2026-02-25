import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  USER_FOLDER_TEMPLATES,
  slugify,
} from '@/constants/storage/folder-templates';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface ApplyFolderTemplateUseCaseRequest {
  tenantId: string;
  targetFolderId: string;
  templateId: string;
  createdBy?: string;
}

interface ApplyFolderTemplateUseCaseResponse {
  createdFolders: StorageFolder[];
  skippedFolders: string[];
}

export class ApplyFolderTemplateUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: ApplyFolderTemplateUseCaseRequest,
  ): Promise<ApplyFolderTemplateUseCaseResponse> {
    const { tenantId, targetFolderId, templateId, createdBy } = request;

    // 1. Validate template exists
    const template = USER_FOLDER_TEMPLATES.find((t) => t.id === templateId);

    if (!template) {
      throw new BadRequestError('Invalid template ID');
    }

    // 2. Validate target folder exists and belongs to tenant
    const targetFolder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(targetFolderId),
      tenantId,
    );

    if (!targetFolder) {
      throw new ResourceNotFoundError('Target folder not found');
    }

    // 3. Prevent applying templates to system folders
    if (targetFolder.isSystem) {
      throw new BadRequestError('Cannot apply template to a system folder');
    }

    // 4. Get existing children to detect duplicates
    const existingChildren = await this.storageFoldersRepository.findChildren(
      new UniqueEntityID(targetFolderId),
      tenantId,
    );

    const existingChildNames = new Set(
      existingChildren.map((child) => child.name.toLowerCase()),
    );

    const createdFolders: StorageFolder[] = [];
    const skippedFolders: string[] = [];

    // 5. Create each folder from template
    for (const folderTemplate of template.folders) {
      if (existingChildNames.has(folderTemplate.name.toLowerCase())) {
        skippedFolders.push(folderTemplate.name);
        continue;
      }

      const childSlug = slugify(folderTemplate.name);
      const childPath = targetFolder.buildChildPath(childSlug);
      const childDepth = targetFolder.depth + 1;

      const folder = await this.storageFoldersRepository.create({
        tenantId,
        parentId: targetFolderId,
        name: folderTemplate.name,
        slug: childSlug,
        path: childPath,
        icon: folderTemplate.icon,
        depth: childDepth,
        createdBy: createdBy ?? null,
      });

      createdFolders.push(folder);
    }

    return { createdFolders, skippedFolders };
  }
}
