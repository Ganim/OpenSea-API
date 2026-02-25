import { randomBytes } from 'node:crypto';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageShareLink } from '@/entities/storage/storage-share-link';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageShareLinksRepository } from '@/repositories/storage/storage-share-links-repository';
import { hash } from 'bcryptjs';

interface CreateShareLinkUseCaseRequest {
  tenantId: string;
  fileId: string;
  createdBy: string;
  expiresAt?: Date | null;
  password?: string | null;
  maxDownloads?: number | null;
}

interface CreateShareLinkUseCaseResponse {
  shareLink: StorageShareLink;
}

export class CreateShareLinkUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageShareLinksRepository: StorageShareLinksRepository,
  ) {}

  async execute(
    request: CreateShareLinkUseCaseRequest,
  ): Promise<CreateShareLinkUseCaseResponse> {
    const { tenantId, fileId, createdBy, expiresAt, password, maxDownloads } =
      request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    const token = randomBytes(32).toString('hex');

    let hashedPassword: string | null = null;
    if (password) {
      hashedPassword = await hash(password, 10);
    }

    const shareLink = await this.storageShareLinksRepository.create({
      tenantId,
      fileId,
      token,
      expiresAt: expiresAt ?? null,
      password: hashedPassword,
      maxDownloads: maxDownloads ?? null,
      createdBy,
    });

    return { shareLink };
  }
}
