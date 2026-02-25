import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface PreviewFileUseCaseRequest {
  tenantId: string;
  fileId: string;
}

interface PreviewFileUseCaseResponse {
  url: string;
  thumbnailUrl: string | null;
  name: string;
  mimeType: string;
  size: number;
  fileType: string;
  previewable: boolean;
}

const PREVIEWABLE_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const PREVIEWABLE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/html',
  'text/csv',
];

export class PreviewFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: PreviewFileUseCaseRequest,
  ): Promise<PreviewFileUseCaseResponse> {
    const { tenantId, fileId } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    const previewable =
      PREVIEWABLE_MIME_PREFIXES.some((prefix) =>
        file.mimeType.startsWith(prefix),
      ) || PREVIEWABLE_MIME_TYPES.includes(file.mimeType);

    const url = await this.fileUploadService.getPresignedUrl(file.fileKey);

    let thumbnailUrl: string | null = null;
    if (file.hasThumbnail) {
      thumbnailUrl = await this.fileUploadService.getPresignedUrl(
        file.thumbnailKey!,
      );
    }

    return {
      url,
      thumbnailUrl,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      fileType: file.fileType,
      previewable,
    };
  }
}
