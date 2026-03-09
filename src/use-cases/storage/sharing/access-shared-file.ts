import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageShareLink } from '@/entities/storage/storage-share-link';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageShareLinksRepository } from '@/repositories/storage/storage-share-links-repository';
import { compare } from 'bcryptjs';

interface AccessSharedFileUseCaseRequest {
  token: string;
  password?: string;
}

interface AccessSharedFileUseCaseResponse {
  file: StorageFile;
  shareLink: StorageShareLink;
}

export class AccessSharedFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageShareLinksRepository: StorageShareLinksRepository,
  ) {}

  async execute(
    request: AccessSharedFileUseCaseRequest,
  ): Promise<AccessSharedFileUseCaseResponse> {
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

    if (!file.isAccessible) {
      throw new ForbiddenError('File is not accessible');
    }

    return { file, shareLink };
  }
}
