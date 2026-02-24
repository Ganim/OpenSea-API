import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';

interface ListFilesUseCaseRequest {
  tenantId: string;
  folderId?: string;
  fileType?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface ListFilesUseCaseResponse {
  files: StorageFile[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ListFilesUseCase {
  constructor(private storageFilesRepository: StorageFilesRepository) {}

  async execute(
    request: ListFilesUseCaseRequest,
  ): Promise<ListFilesUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { files, total } = await this.storageFilesRepository.findMany({
      tenantId: request.tenantId,
      folderId: request.folderId,
      fileType: request.fileType,
      entityType: request.entityType,
      entityId: request.entityId,
      search: request.search,
      status: request.status,
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
