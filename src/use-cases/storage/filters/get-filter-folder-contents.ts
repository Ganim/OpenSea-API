import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface GetFilterFolderContentsUseCaseRequest {
  tenantId: string;
  folderId: string;
  page?: number;
  limit?: number;
}

interface GetFilterFolderContentsUseCaseResponse {
  files: StorageFile[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class GetFilterFolderContentsUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
  ) {}

  async execute(
    request: GetFilterFolderContentsUseCaseRequest,
  ): Promise<GetFilterFolderContentsUseCaseResponse> {
    const { tenantId, folderId } = request;
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    if (!folder.isFilter) {
      throw new BadRequestError(
        'This folder is not a filter folder. Use the regular folder contents endpoint instead.',
      );
    }

    const filterFileType = folder.filterFileType;

    if (!filterFileType) {
      throw new BadRequestError('Filter folder has no file type configured.');
    }

    // Query ALL files in the tenant with the matching fileType,
    // regardless of which folder they belong to
    const { files, total } = await this.storageFilesRepository.findMany({
      tenantId,
      fileType: filterFileType,
      page,
      limit,
    });

    const pages = Math.ceil(total / limit);

    return {
      files,
      total,
      page,
      limit,
      pages,
    };
  }
}
