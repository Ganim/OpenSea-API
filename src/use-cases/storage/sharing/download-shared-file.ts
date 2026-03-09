import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageShareLinksRepository } from '@/repositories/storage/storage-share-links-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { compare } from 'bcryptjs';

interface DownloadSharedFileUseCaseRequest {
  token: string;
  password?: string;
}

interface DownloadSharedFileUseCaseResponse {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
}

export class DownloadSharedFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageShareLinksRepository: StorageShareLinksRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: DownloadSharedFileUseCaseRequest,
  ): Promise<DownloadSharedFileUseCaseResponse> {
    const { token, password } = request;

    const shareLink = await this.storageShareLinksRepository.findByToken(token);

    if (!shareLink) {
      throw new ResourceNotFoundError('Share link not found');
    }

    if (!shareLink.isActive) {
      throw new ForbiddenError('Share link has been revoked');
    }

    if (shareLink.isExpired) {
      throw new ForbiddenError('Share link has expired');
    }

    if (shareLink.isDownloadLimitReached) {
      throw new ForbiddenError('Download limit reached');
    }

    if (shareLink.password) {
      if (!password) {
        throw new ForbiddenError('Password is required');
      }

      const passwordMatches = await compare(password, shareLink.password);

      if (!passwordMatches) {
        throw new ForbiddenError('Invalid password');
      }
    }

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(shareLink.fileId.toString()),
      shareLink.tenantId.toString(),
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    shareLink.incrementDownloads();
    await this.storageShareLinksRepository.save(shareLink);

    const buffer = await this.fileUploadService.getObject(file.fileKey);

    return {
      buffer,
      fileName: file.name,
      mimeType: file.mimeType,
      size: buffer.length,
    };
  }
}
