import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface RenameFileUseCaseRequest {
  tenantId: string;
  fileId: string;
  name: string;
}

interface RenameFileUseCaseResponse {
  file: StorageFile;
}

export class RenameFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(
    request: RenameFileUseCaseRequest,
  ): Promise<RenameFileUseCaseResponse> {
    const { tenantId, fileId, name } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('File name is required');
    }

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    const folder = await this.storageFoldersRepository.findById(
      file.folderId,
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Parent folder not found');
    }

    const newSlug = name.toLowerCase().trim().replace(/\s+/g, '-');
    const newPath = folder.buildChildPath(newSlug);

    const updatedFile = await this.storageFilesRepository.update({
      id: file.id,
      name: name.trim(),
      path: newPath,
    });

    if (!updatedFile) {
      throw new ResourceNotFoundError('File not found');
    }

    return {
      file: updatedFile,
    };
  }
}
