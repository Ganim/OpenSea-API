import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  StorageFoldersRepository,
  UpdateStorageFolderSchema,
} from '@/repositories/storage/storage-folders-repository';

interface UpdateFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
  color?: string | null;
  icon?: string | null;
}

interface UpdateFolderUseCaseResponse {
  folder: import('@/entities/storage/storage-folder').StorageFolder;
}

export class UpdateFolderUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: UpdateFolderUseCaseRequest,
  ): Promise<UpdateFolderUseCaseResponse> {
    const { tenantId, folderId, color, icon } = request;

    const existingFolder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!existingFolder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    const updatePayload: UpdateStorageFolderSchema = {
      id: new UniqueEntityID(folderId),
    };

    if (color !== undefined) {
      updatePayload.color = color;
    }

    if (icon !== undefined) {
      updatePayload.icon = icon;
    }

    const updatedFolder =
      await this.storageFoldersRepository.update(updatePayload);

    if (!updatedFolder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    return {
      folder: updatedFolder,
    };
  }
}
