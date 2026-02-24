import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

interface GetFolderBreadcrumbUseCaseRequest {
  tenantId: string;
  folderId: string;
}

interface GetFolderBreadcrumbUseCaseResponse {
  breadcrumb: BreadcrumbItem[];
}

export class GetFolderBreadcrumbUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: GetFolderBreadcrumbUseCaseRequest,
  ): Promise<GetFolderBreadcrumbUseCaseResponse> {
    const { tenantId, folderId } = request;

    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // Walk up the tree from the current folder to the root
    const breadcrumb: BreadcrumbItem[] = [];
    let currentFolder = folder;

    while (currentFolder) {
      breadcrumb.unshift({
        id: currentFolder.id.toString(),
        name: currentFolder.name,
        path: currentFolder.path,
      });

      if (currentFolder.parentId) {
        const parentFolder = await this.storageFoldersRepository.findById(
          currentFolder.parentId,
          tenantId,
        );

        if (!parentFolder) {
          break;
        }

        currentFolder = parentFolder;
      } else {
        break;
      }
    }

    return {
      breadcrumb,
    };
  }
}
