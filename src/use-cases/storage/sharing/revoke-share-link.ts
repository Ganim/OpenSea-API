import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageShareLinksRepository } from '@/repositories/storage/storage-share-links-repository';

interface RevokeShareLinkUseCaseRequest {
  tenantId: string;
  linkId: string;
}

export class RevokeShareLinkUseCase {
  constructor(
    private storageShareLinksRepository: StorageShareLinksRepository,
  ) {}

  async execute(request: RevokeShareLinkUseCaseRequest): Promise<void> {
    const { tenantId, linkId } = request;

    const shareLink = await this.storageShareLinksRepository.findById(
      new UniqueEntityID(linkId),
      tenantId,
    );

    if (!shareLink) {
      throw new ResourceNotFoundError('Share link not found');
    }

    shareLink.revoke();

    await this.storageShareLinksRepository.save(shareLink);
  }
}
